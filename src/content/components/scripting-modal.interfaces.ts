/**
 * The scripting data for the modal.
 */
export interface ScriptingModalData {

  /**
   * The Javascript or Typescript code to execute in the frame.
   */
  code: string;

  /**
   * The href of the frame where the code will be executed.
   */
  frameHref: string;

}
