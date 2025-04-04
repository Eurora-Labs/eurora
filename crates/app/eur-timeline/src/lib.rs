//! Timeline module for storing system state over time
//!
//! This crate provides functionality to capture system state at regular intervals
//! and store it in memory for later retrieval. It works by sampling data every
//! 3 seconds and maintaining a rolling history.

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use eur_proto::ipc::{ProtoArticleState, ProtoPdfState, ProtoTranscriptLine, ProtoYoutubeState};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::task::JoinSet;
use tokio::time;
use tracing::{debug, error, info};

pub mod browser_state;
pub use browser_state::*;

// Custom serialization for ImageBuffer
mod image_serde {
    use super::*;
    use image::{ImageBuffer, Rgba};
    use serde::de::{self};
    use serde::ser::SerializeStruct;
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(
        img: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        serializer: S,
    ) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let (width, height) = img.dimensions();
        let raw_data = img.as_raw();

        let mut state = serializer.serialize_struct("ImageBuffer", 3)?;
        state.serialize_field("width", &width)?;
        state.serialize_field("height", &height)?;
        state.serialize_field("data", raw_data)?;
        state.end()
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        struct ImageData {
            width: u32,
            height: u32,
            data: Vec<u8>,
        }

        let data = ImageData::deserialize(deserializer)?;
        ImageBuffer::from_raw(data.width, data.height, data.data)
            .ok_or_else(|| de::Error::custom("Failed to create ImageBuffer from data"))
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SystemState {}

/// A Fragment represents a snapshot of system state at a single point in time
#[derive(Clone, Debug)]
pub struct Fragment {
    /// When this fragment was captured
    pub timestamp: DateTime<Utc>,

    pub browser_state: Option<BrowserState>,
    // pub system_state: Option<SystemState>,

    // Screenshot data, if available
    // pub screenshot: Option<Vec<u8>>,

    // Additional metadata about this fragment
    // #[serde(default)]
    // pub metadata: serde_json::Value,
}

/// Timeline store that holds fragments of system state over time
pub struct Timeline {
    /// The fragments stored in the timeline
    fragments: Arc<RwLock<Vec<Fragment>>>,

    /// How many fragments to keep in history
    capacity: usize,

    /// How often to capture a new fragment (in seconds)
    interval_seconds: u64,

    /// Persistent browser collector to avoid recreating it on each collection
    browser_collector: Arc<Mutex<Option<BrowserCollector>>>,
}

impl Timeline {
    /// Create a new timeline with the specified capacity
    pub fn new(capacity: usize, interval_seconds: u64) -> Self {
        Self {
            fragments: Arc::new(RwLock::new(Vec::with_capacity(capacity))),
            capacity,
            interval_seconds,
            browser_collector: Arc::new(Mutex::new(None)),
        }
    }

    /// Get a fragment from the specified number of seconds ago
    pub fn get_fragment_from_seconds_ago(&self, seconds_ago: u64) -> Option<Fragment> {
        let index = (seconds_ago / self.interval_seconds) as usize;
        self.get_fragment_at_index(index)
    }

    /// Get a fragment at the specified index
    pub fn get_fragment_at_index(&self, index: usize) -> Option<Fragment> {
        let fragments = self.fragments.read();
        if index >= fragments.len() {
            return None;
        }

        // Calculate the actual index, accounting for the circular buffer
        let actual_index = (fragments.len() - 1) - index;
        fragments.get(actual_index).cloned()
    }

    /// Get all fragments in chronological order (oldest first)
    pub fn get_all_fragments(&self) -> Vec<Fragment> {
        let fragments = self.fragments.read();
        fragments.clone()
    }

    pub fn get_most_recent_fragment(&self) -> Option<Fragment> {
        let fragments = self.fragments.read();
        fragments.last().cloned()
    }

    /// Start the timeline collection process
    pub async fn start_collection(&self) -> Result<()> {
        info!(
            "Starting timeline collection every {} seconds",
            self.interval_seconds
        );

        let fragments = Arc::clone(&self.fragments);
        let browser_collector = Arc::clone(&self.browser_collector);
        let capacity = self.capacity;
        let interval = Duration::from_secs(self.interval_seconds);

        tokio::spawn(async move {
            let mut interval_timer = time::interval(interval);

            // Initialize the browser collector if it hasn't been initialized yet
            {
                let mut collector_guard = browser_collector.lock().await;
                if collector_guard.is_none() {
                    match BrowserCollector::new().await {
                        Ok(collector) => {
                            *collector_guard = Some(collector);
                        }
                        Err(e) => {
                            error!("Failed to initialize browser collector: {}", e);
                            return;
                        }
                    }
                }
            }

            loop {
                interval_timer.tick().await;

                // Step 1: Collect the new fragment
                // The collect_fragment function ensures all collectors finish their work
                // before returning the completed fragment
                let fragment_result = Self::collect_fragment(Arc::clone(&browser_collector)).await;

                // Step 2: Only after all collectors have finished, we add the fragment to the timeline
                match fragment_result {
                    Ok(fragment) => {
                        // All collectors have definitively completed their work at this point
                        let mut fragments_write = fragments.write();
                        fragments_write.push(fragment);

                        // Trim the vector if it exceeds capacity
                        if fragments_write.len() > capacity {
                            fragments_write.remove(0);
                        }

                        debug!(
                            "Collected new fragment, now have {}/{} fragments",
                            fragments_write.len(),
                            capacity
                        );
                    }
                    Err(e) => {
                        error!("Failed to collect fragment: {}", e);
                    }
                }
            }
        });

        Ok(())
    }

    /// Collect a new fragment on demand
    pub async fn collect_new_fragment(&self) -> Result<Fragment> {
        let browser_collector = Arc::clone(&self.browser_collector);
        Self::collect_fragment(browser_collector).await
    }

    /// Collect a new fragment from system state
    /// Uses a JoinSet to ensure all collectors finish before returning the fragment
    async fn collect_fragment(
        browser_collector: Arc<Mutex<Option<BrowserCollector>>>,
    ) -> Result<Fragment> {
        let timestamp = Utc::now();

        // Create a JoinSet to manage all collector tasks
        // This approach allows for easily adding more collectors in the future
        let mut collection_tasks = JoinSet::new();

        // Spawn a task for the browser collector
        let browser_collector_clone = Arc::clone(&browser_collector);
        collection_tasks.spawn(async move {
            let mut collector_guard = browser_collector_clone.lock().await;
            let collector = collector_guard
                .as_mut()
                .context("Browser collector not initialized")?;

            collector
                .collect_state()
                .await
                .context("Failed to collect browser state")
        });

        // Here you could add additional collectors in the future:
        // collection_tasks.spawn(async move { collect_system_state().await });
        // collection_tasks.spawn(async move { collect_network_state().await });

        // Wait for browser state collection to complete
        let mut browser_state: Option<BrowserState> = None;

        // Process the results from all collectors
        while let Some(result) = collection_tasks.join_next().await {
            match result {
                Ok(Ok(state_option)) => {
                    // Store each type of state in its appropriate place
                    // Currently we only have browser state
                    // collect_state() returns an Option<BrowserState>
                    if let Some(state) = state_option {
                        browser_state = Some(state);
                    }
                }
                Ok(Err(e)) => {
                    // A collector task returned an error
                    error!("Collector task error: {}", e);
                    // Continue with other collectors instead of failing completely
                }
                Err(e) => {
                    // A collector task panicked
                    error!("Collector task panicked: {}", e);
                    // Continue with other collectors instead of failing completely
                }
            }
        }

        // All collectors have completed at this point
        // Now we can create the fragment with all collected data
        Ok(Fragment {
            timestamp,
            browser_state,
        })
    }
}

/// Create a new timeline with default settings
pub fn create_default_timeline() -> Timeline {
    // Default to 1 hour of history (1200 fragments at 3-second intervals)
    Timeline::new(1200, 3)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_browser_state_types() {
        // Create a YoutubeState
        let youtube_proto = ProtoYoutubeState {
            url: "https://youtube.com/watch?v=12345".to_string(),
            title: "Test Video".to_string(),
            transcript: vec![ProtoTranscriptLine {
                text: "Test transcript".to_string(),
                start: 0.0,
                duration: 30.0,
            }],
            current_time: 30.0,
            video_frame: None,
        };
        let youtube_state = ProtoYoutubeState::from(youtube_proto.clone());
        let browser_state = BrowserState::Youtube(youtube_state);

        // Verify conversion back to proto
        let youtube_state_ref = browser_state_to_youtube(&browser_state).unwrap();
        let proto_from_state: ProtoYoutubeState = youtube_state_ref.clone();
        assert_eq!(proto_from_state.url, youtube_proto.url);
        assert_eq!(proto_from_state.title, youtube_proto.title);
        assert_eq!(proto_from_state.transcript, youtube_proto.transcript);
        assert_eq!(proto_from_state.current_time, youtube_proto.current_time);

        // Create an ArticleState
        let article_proto = ProtoArticleState {
            url: "https://example.com/article".to_string(),
            title: "Test Article".to_string(),
            content: "Article content".to_string(),
            selected_text: "Selected text".to_string(),
        };
        let article_state = ProtoArticleState::from(article_proto.clone());
        let browser_state2 = BrowserState::Article(article_state);

        // Verify conversion back to proto
        let article_state_ref = browser_state_to_article(&browser_state2).unwrap();
        let proto_from_state: ProtoArticleState = article_state_ref.clone();
        assert_eq!(proto_from_state.url, article_proto.url);
        assert_eq!(proto_from_state.title, article_proto.title);
        assert_eq!(proto_from_state.content, article_proto.content);
        assert_eq!(proto_from_state.selected_text, article_proto.selected_text);

        // Create a PdfState
        let pdf_proto = ProtoPdfState {
            url: "https://example.com/document.pdf".to_string(),
            title: "Test PDF".to_string(),
            content: "PDF content".to_string(),
            selected_text: "Selected PDF text".to_string(),
        };
        let pdf_state = ProtoPdfState::from(pdf_proto.clone());
        let browser_state3 = BrowserState::Pdf(pdf_state);

        // Verify conversion back to proto
        let pdf_state_ref = browser_state_to_pdf(&browser_state3).unwrap();
        let proto_from_state: ProtoPdfState = pdf_state_ref.clone();
        assert_eq!(proto_from_state.url, pdf_proto.url);
        assert_eq!(proto_from_state.title, pdf_proto.title);
        assert_eq!(proto_from_state.content, pdf_proto.content);
        assert_eq!(proto_from_state.selected_text, pdf_proto.selected_text);
    }

    // Helper functions for the tests
    fn browser_state_to_youtube(state: &BrowserState) -> Option<&ProtoYoutubeState> {
        match state {
            BrowserState::Youtube(youtube) => Some(youtube),
            _ => None,
        }
    }

    fn browser_state_to_article(state: &BrowserState) -> Option<&ProtoArticleState> {
        match state {
            BrowserState::Article(article) => Some(article),
            _ => None,
        }
    }

    fn browser_state_to_pdf(state: &BrowserState) -> Option<&ProtoPdfState> {
        match state {
            BrowserState::Pdf(pdf) => Some(pdf),
            _ => None,
        }
    }
}
