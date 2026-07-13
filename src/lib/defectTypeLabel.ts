/**
 * Defects logged with a quantity but no defect type.
 *
 * The database reports them under this sentinel rather than under a name of its
 * own invention, so the label can be rendered in whichever language the reader
 * is using - the same reason defect descriptions are no longer stored as prose.
 *
 * It is a sentinel string and not NULL because the app is a PWA: a tablet still
 * running a service-worker cached bundle sorts these rows with
 * localeCompare(), which throws on null. An unknown string it just prints.
 */
export const UNCLASSIFIED_DEFECT_TYPE = 'UNCLASSIFIED'

type Translate = (key: string) => string

export function defectTypeLabel(defectType: string, t: Translate): string {
  return defectType === UNCLASSIFIED_DEFECT_TYPE
    ? t('charts.unclassifiedDefect')
    : defectType
}
