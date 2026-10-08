/**
 * Instance Management CUSTOM COLUMNS domain service — the API surface for
 * the user-defined columns shown alongside the fixed built-ins (Instance
 * / Ticket Number / Status). Field names match the backend's camelCase
 * schemas (PineLabs_Backend/app/schemas/instance.py — InstanceColumn*).
 *
 * A column definition looks like:
 *   { id, key, label, type: 'text'|'number'|'date'|'dropdown',
 *     required, defaultValue, options: string[]|null, sortOrder }
 * `key` is the stable machine key used inside an instance's customFields;
 * `label` is the (renameable) header + the exact CSV/Excel upload header.
 */
import { endpoints } from './endpoints'
import { httpService } from './httpService'

export const instanceColumnService = {
  /**
   * Both column views in a single round-trip:
   *   {
   *     definitions: [ { id, key, label, type, required, defaultValue,
   *                      options, afterKey, sortOrder }, ... ], // custom only
   *     layout:      [ { key, label, builtin, id?, type?, required?,
   *                      options? }, ... ]  // built-ins + custom, ordered
   *   }
   * `definitions` drives the create form + required markers + import/
   * export mapping; `layout` is what the table renders left-to-right
   * (actions column pinned last, client-side).
   */
  get() {
    return httpService.get(endpoints.instances.columns)
  },

  /**
   * Create a custom column.
   * payload: { label, type, required, defaultValue?, options?: string[],
   *            ticketNumber, revisedBy, reviewer }
   * ticketNumber/revisedBy/reviewer are the mandatory audit trail
   * (persisted on the column row). Backfills existing instances with the
   * default (or NA).
   */
  create(payload) {
    return httpService.post(endpoints.instances.columns, payload)
  },

  /**
   * Partial update of a column definition (rename label, toggle
   * required, change default/options). The column key never changes.
   */
  update(id, payload) {
    return httpService.patch(endpoints.instances.columnById(id), payload)
  },

  /**
   * Delete a custom column (strips its values from every instance) and
   * record the deletion audit.
   * audit: { ticketNumber, revisedBy, reviewer } — all mandatory
   * (enforced by the Delete Column dialog and the backend schema). Sent
   * as the DELETE request body.
   */
  remove(id, audit) {
    return httpService.delete(endpoints.instances.columnById(id), { data: audit })
  },

  /**
   * Reorder the WHOLE table (built-in + custom columns) — pass the full
   * ordered list of column KEYS, left-to-right, exactly as they should
   * appear (i.e. every `key` from layout() in the new order). The backend
   * re-anchors each column from this list and returns the fresh layout
   * (same shape as layout()).
   */
  reorder(orderedKeys) {
    return httpService.patch(endpoints.instances.columnsReorder, { orderedKeys })
  },
}
