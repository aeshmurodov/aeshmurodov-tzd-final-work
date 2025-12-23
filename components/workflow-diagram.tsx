"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FileSignature, Lock, CheckCircle, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface WorkflowDiagramProps {
  currentStatus?: "draft" | "signed" | "encrypted" | "verified"
}

export function WorkflowDiagram({ currentStatus }: WorkflowDiagramProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const stages = [
    {
      icon: FileText,
      label: "Черновик",
      description: "Загрузка документа, вычисление хэша Стрибог-512",
      status: "draft",
    },
    {
      icon: FileSignature,
      label: "Подписан",
      description: "Наложение ЭЦП ГОСТ 34.10-2018",
      status: "signed",
    },
    {
      icon: Lock,
      label: "Зашифрован",
      description: "Шифрование в режиме MGM (ГОСТ 34.13)",
      status: "encrypted",
    },
    {
      icon: CheckCircle,
      label: "Проверен",
      description: "Проверка подписи и целостности",
      status: "verified",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Жизненный цикл документа</CardTitle>
            <CardDescription>Интерактивная схема движения документов в ЗЭДКД-Next</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Скрыть
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Показать
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {stages.map((stage, index) => {
              const isActive = currentStatus === stage.status
              const isPast =
                currentStatus &&
                ["draft", "signed", "encrypted", "verified"].indexOf(currentStatus) >
                  ["draft", "signed", "encrypted", "verified"].indexOf(stage.status)

              return (
                <div key={index} className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={cn(
                        "rounded-full border-2 p-3 transition-all duration-300",
                        isActive &&
                          "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/50 scale-110 animate-pulse",
                        isPast && "bg-primary/20 text-primary border-primary",
                        !isActive && !isPast && "text-muted-foreground border-muted",
                      )}
                    >
                      <stage.icon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <div
                        className={cn(
                          "font-semibold text-sm transition-colors",
                          isActive && "text-primary",
                          isPast && "text-primary/80",
                        )}
                      >
                        {stage.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 max-w-[150px]">{stage.description}</div>
                    </div>
                  </div>
                  {index < stages.length - 1 && (
                    <ArrowRight
                      className={cn(
                        "hidden md:block h-6 w-6 flex-shrink-0 transition-colors",
                        isPast ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
