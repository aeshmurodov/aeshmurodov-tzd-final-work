import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { NavBar } from "@/components/nav-bar"
import { ProfileForm } from "@/components/profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProfilePage() {
  const user = await getSession()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Настройки профиля</h2>
            <p className="text-muted-foreground">Управление вашей учетной записью и персональными данными</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Информация о пользователе</CardTitle>
              <CardDescription>Обновите ваши личные данные и контактную информацию</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Информация об учетной записи</CardTitle>
              <CardDescription>Данные вашей учетной записи в системе</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Имя пользователя</p>
                  <p className="text-sm font-mono">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Роль</p>
                  <p className="text-sm capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID пользователя</p>
                  <p className="text-sm font-mono">{user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
