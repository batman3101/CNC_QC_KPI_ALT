/**
 * How a defect's description is shown.
 *
 * Auto-created defects store no description. They used to store a Korean
 * sentence, which meant a Vietnamese inspector read Korean and no amount of
 * component-level i18n could fix it - the value was already in the database.
 * So the sentence is composed here, at display time, in whatever language the
 * reader is using. The one fact it carried (the defect quantity) lives on the
 * inspection row and is joined in by getDefectsPage.
 */

type Translate = (key: string, options?: Record<string, unknown>) => string

/**
 * The sentences the app itself used to write. They are not an inspector's words,
 * so they count as no description at all and get re-rendered in the reader's
 * language.
 *
 * The code no longer writes them, but this still has to match: the app is a PWA,
 * so a tablet running a service-worker-cached older build keeps producing them
 * until it updates. Without this, every row written during a rollout would show
 * Korean to a Vietnamese inspector, and the database cleanup would have to be
 * re-run after each one.
 */
const APP_WRITTEN_DESCRIPTION = /^검사\s*불합격(\s*-\s*불량\s*수량:\s*\d+)?$/

export interface DescribableDefect {
  description?: string | null
  /** From the parent inspection; absent on rows fetched without the join. */
  inspection_defect_quantity?: number | null
}

export function describeDefect(defect: DescribableDefect, t: Translate): string {
  const authored = defect.description?.trim()
  if (authored && !APP_WRITTEN_DESCRIPTION.test(authored)) return authored

  const quantity = defect.inspection_defect_quantity
  return quantity != null
    ? t('defects.autoCreatedWithQuantity', { count: quantity })
    : t('defects.autoCreated')
}
