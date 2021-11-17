/* eslint-disable @typescript-eslint/naming-convention */
export interface SessionEvent {
  timestamp: number;
  user_id: number;
  session_id: number;
  event: number;
  match_id: number;
}
