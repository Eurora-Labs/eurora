use anyhow::{Result, anyhow};
use eur_vision::capture_monitor_region;
use std::time::Instant;
use std::{fs, path::Path};
use xcap::Monitor;

fn main() -> Result<()> {
    // Create screenshots directory if it doesn't exist
    let screenshot_dir = Path::new("examples/screenshots");
    if !screenshot_dir.exists() {
        fs::create_dir_all(screenshot_dir)?;
    }

    println!("Running region capture...");
    let start = Instant::now();

    let monitor = Monitor::all()?
        .into_iter()
        .next()
        .ok_or_else(|| anyhow!("No monitors found"))?;

    let width = monitor.width().unwrap() as i32;
    let height = monitor.height().unwrap() as i32;
    let start_x = width / 4; // Start from 1/4th of monitor width

    let image = capture_monitor_region(monitor, start_x as u32, 0, width as u32, height as u32)?;
    let duration = start.elapsed();

    println!("Region capture completed in: {:?}", duration);
    println!(
        "Captured image dimensions: {}x{}",
        image.width(),
        image.height()
    );

    // Save the captured image
    let filename = screenshot_dir.join("region_capture.png");
    image.save(&filename)?;
    println!("Region image saved to: {}", filename.display());

    println!("-----------------------------------");
    println!("Region capture completed successfully!");

    Ok(())
}
