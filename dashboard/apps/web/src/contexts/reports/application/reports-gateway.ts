/**
 * Port: ReportsGateway
 *
 * Lives in the application layer so that the use case depends on the
 * abstraction, not the concrete HTTP adapter. Infrastructure implements
 * this interface; application never imports from infrastructure.
 */

import type { Result } from "../../../shared/result";
import type { Report } from "../domain/report";

export interface ReportsGateway {
  list(token: string): Promise<Result<Report[]>>;
}
