import { Plugin } from 'ckeditor5/src/core';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import maximizeIcon from './maximize.svg';
import minimizeIcon from './minimize.svg';

export default class RemoveStyle extends Plugin {
	public init(): void {
		const editor = this.editor;
		// @ts-ignore
		const open = editor.config._config.removeStyle.onOpen;
		// @ts-ignore
		const isActive = editor.config._config.removeStyle.isActive;
		// The button must be registered among the UI components of the editor
		// to be displayed in the toolbar.
		editor.ui.componentFactory.add('removeStyle', () => {
			// The button will be an instance of ButtonView.
			const button = new ButtonView();
			button.set({
				label: 'RemoveStyle',
				withText: false,
				tooltip: true,
				icon: maximizeIcon,
			});

			button.on('execute', () => {
				open();
				button.set({
					label: 'RemoveStyle',
					withText: false,
					icon: isActive ? minimizeIcon : maximizeIcon,
				});
			});

			return button;
		});
	}
}
