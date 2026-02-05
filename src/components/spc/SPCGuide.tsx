/**
 * SPC Guide 컴포넌트
 * SPC 지표에 대한 설명 및 개선 방법 안내
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import {
  Info,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

export function SPCGuide() {
  const { t } = useTranslation()

  return (
    <Card className="shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border-blue-200 dark:border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {t('spc.guide.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* SPC 개요 */}
          <AccordionItem value="spc-overview">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                {t('spc.guide.whatIsSPC')}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('spc.guide.whatIsSPCDesc')}
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Cpk 설명 */}
          <AccordionItem value="cpk">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                {t('spc.guide.cpkTitle')}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('spc.guide.cpkDesc')}
                </p>

                {/* Cpk 등급 */}
                <div className="space-y-2 mt-3">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-500 text-white shrink-0 mt-0.5">≥1.67</Badge>
                    <span className="text-sm">{t('spc.guide.cpkExcellent')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-blue-500 text-white shrink-0 mt-0.5">1.33~1.67</Badge>
                    <span className="text-sm">{t('spc.guide.cpkGood')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-yellow-500 text-black shrink-0 mt-0.5">1.0~1.33</Badge>
                    <span className="text-sm">{t('spc.guide.cpkAdequate')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-red-500 text-white shrink-0 mt-0.5">&lt;1.0</Badge>
                    <span className="text-sm">{t('spc.guide.cpkPoor')}</span>
                  </div>
                </div>

                {/* 개선 방법 */}
                <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    💡 {t('spc.guide.cpkImprove')}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 관리도 설명 */}
          <AccordionItem value="control-chart">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                {t('spc.guide.controlChartTitle')}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('spc.guide.controlChartDesc')}
                </p>

                {/* 관리선 설명 */}
                <div className="space-y-2 mt-3">
                  <div className="flex items-start gap-2">
                    <div className="w-12 h-0.5 bg-red-500 mt-2 shrink-0" />
                    <span className="text-sm">{t('spc.guide.uclDesc')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-12 h-0.5 bg-green-500 mt-2 shrink-0" />
                    <span className="text-sm">{t('spc.guide.clDesc')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-12 h-0.5 bg-red-500 mt-2 shrink-0" />
                    <span className="text-sm">{t('spc.guide.lclDesc')}</span>
                  </div>
                </div>

                {/* 개선 방법 */}
                <div className="mt-3 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    ⚠️ {t('spc.guide.controlChartImprove')}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 알림 규칙 */}
          <AccordionItem value="alerts">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                {t('spc.guide.alertsTitle')}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('spc.guide.alertsDesc')}
                </p>

                {/* 규칙 목록 */}
                <div className="space-y-2 mt-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{t('spc.guide.rule1')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{t('spc.guide.rule2')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{t('spc.guide.rule3')}</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
