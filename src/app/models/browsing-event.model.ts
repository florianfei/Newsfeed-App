/* eslint-disable @typescript-eslint/naming-convention */
export interface BrowsingEvent {
  timestamp: number;
  user_id: number;
  session_id: number;
  event: number;
  load_id: number;
  focus_id: number;
  view_id: number;
  source: number;
}
