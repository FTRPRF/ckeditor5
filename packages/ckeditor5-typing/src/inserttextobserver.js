/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module typing/inserttextobserver
 */

import DomEventData from '@ckeditor/ckeditor5-engine/src/view/observer/domeventdata';
import Observer from '@ckeditor/ckeditor5-engine/src/view/observer/observer';
import EventInfo from '@ckeditor/ckeditor5-utils/src/eventinfo';

const TYPING_INPUT_TYPES = [
	// For collapsed range:
	//	- This one is a regular typing (all browsers, all systems).
	//	- This one is used by Chrome when typing accented letter – 2nd step when the user selects the accent (Mac).
	// For non-collapsed range:
	//	- This one is used by Chrome when typing accented letter – when the selection box first appears (Mac).
	//	- This one is used by Safari when accepting spell check suggestions from the context menu (Mac).
	'insertText',

	// This one is used by Safari when typing accented letter (Mac).
	// This one is used by Safari when accepting spell check suggestions from the autocorrection pop-up (Mac).
	'insertReplacementText'
];

/**
 * Text insertion observer introduces the {@link module:engine/view/document~Document#event:insertText} event.
 *
 * @extends module:engine/view/observer/observer~Observer
 */
export default class InsertTextObserver extends Observer {
	/**
	 * @inheritDoc
	 */
	constructor( view ) {
		super( view );

		const viewDocument = view.document;

		viewDocument.on( 'beforeinput', ( evt, data ) => {
			if ( !this.isEnabled ) {
				return;
			}

			const { data: text, targetRanges, inputType, domEvent } = data;

			if ( !TYPING_INPUT_TYPES.includes( inputType ) ) {
				return;
			}

			const eventInfo = new EventInfo( viewDocument, 'insertText' );

			viewDocument.fire( eventInfo, new DomEventData( viewDocument, domEvent, {
				text,
				selection: view.createSelection( targetRanges )
			} ) );

			// Stop the beforeinput event if `delete` event was stopped.
			// https://github.com/ckeditor/ckeditor5/issues/753
			if ( eventInfo.stop.called ) {
				evt.stop();
			}
		} );

		// Note: The priority must be lower than the CompositionObserver handler to call it after the renderer is unblocked.
		viewDocument.on( 'compositionend', ( evt, { data, domEvent } ) => {
			// In case of aborted composition.
			if ( !data ) {
				return;
			}

			// How do we know where to insert the composed text?
			// The selection observer is blocked and the view is not updated with the composition changes.
			// There were three options:
			//   - Store the selection on `compositionstart` and use it now. This wouldn't work in RTC
			//     where the view would change and the stored selection might get incorrect.
			//     We'd need to fallback to the current view selection anyway.
			//   - Use the current view selection. This is a bit weird and non-intuitive because
			//     this isn't necessarily the selection on which the user started composing.
			//     We cannot even know whether it's still collapsed (there might be some weird
			//     editor feature that changed it in unpredictable ways for us). But it's by far
			//     the simplest solution and should be stable (the selection is definitely correct)
			//     and probably mostly predictable (features usually don't modify the selection
			//     unless called explicitly by the user).
			//   - Try to follow it from the `beforeinput` events. This would be really complex as each
			//     `beforeinput` would come with just the range it's changing and we'd need to calculate that.
			// We decided to go with the 2nd option for its simplicity and stability.
			// TODO maybe we should not pass the DOM event and only translate what we could need in the view/model
			viewDocument.fire( 'insertText', new DomEventData( viewDocument, domEvent, {
				text: data,
				selection: viewDocument.selection
			} ) );
		}, { priority: 'lowest' } );
	}

	/**
	 * @inheritDoc
	 */
	observe() {}
}

/**
 * Event fired when the user types text, for instance presses <kbd>A</kbd> or <kbd>?</kbd> in the
 * editing view document.
 *
 * **Note**: This event will **not** fire for keystrokes such as <kbd>Delete</kbd> or <kbd>Enter</kbd>.
 * They have dedicated events, see {@link module:engine/view/document~Document#event:delete} and
 * {@link module:engine/view/document~Document#event:enter} to learn more.
 *
 * **Note**: This event is fired by the {@link module:typing/inserttextobserver~InsertTextObserver input feature}.
 *
 * @event module:engine/view/document~Document#event:insertText
 * @param {module:engine/view/observer/domeventdata~DomEventData} data
 * @param {String} data.text The text to be inserted.
 * @param {module:engine/view/selection~Selection} [data.selection] The selection into which the text should be inserted.
 * If not specified, the insertion should occur at the current view selection.
 * @param {module:engine/view/range~Range} [data.resultRange] The range that view selection should be set to after insertion.
 */
