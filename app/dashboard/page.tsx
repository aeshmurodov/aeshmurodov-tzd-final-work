import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { NavBar } from "@/components/nav-bar"
import { StatsCards } from "@/components/stats-cards"
import { WorkflowDiagram } from "@/components/workflow-diagram"
import { DocumentUpload } from "@/components/document-upload"
import { DocumentList } from "@/components/document-list"
import { AuditLog } from "@/components/audit-log"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Панель управления</h2>
            <p className="text-muted-foreground">
              Управление защищенными документами с использованием криптографии ГОСТ
            </p>
          </div>

          <StatsCards />

          <WorkflowDiagram />

          <Tabs defaultValue="documents" className="space-y-4">
            <TabsList>
              <TabsTrigger value="documents">Документы</TabsTrigger>
              <TabsTrigger value="upload">Загрузка</TabsTrigger>
              {(user.role === "admin" || user.role === "manager") && <TabsTrigger value="audit">Аудит</TabsTrigger>}
            </TabsList>

            <TabsContent value="documents" className="space-y-4">
              <DocumentList />
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <DocumentUpload />
            </TabsContent>

            {(user.role === "admin" || user.role === "manager") && (
              <TabsContent value="audit" className="space-y-4">
                <AuditLog />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  )
}
