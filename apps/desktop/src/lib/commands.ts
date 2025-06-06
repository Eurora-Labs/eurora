import type { Editor } from '@eurora/prosemirror-core';
import type { ContextChip } from '@eurora/tauri-bindings';

export function executeCommand(editorRef: Editor, command: ContextChip) {
	if (!editorRef) return;
	console.log('command', command);
	editorRef.cmd((state, dispatch) => {
		const tr = state.tr;
		const { schema } = state;
		const nodes = schema.nodes;
		tr.insert(
			command.position ?? 0,
			nodes[command.extension_id].createChecked(
				{ id: command.id, name: command.name, ...command.attrs },
				schema.text(command.name ?? ' ')
			)
		);
		dispatch?.(tr);
	});
}
