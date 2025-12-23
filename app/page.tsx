import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { LoginForm } from "@/components/login-form"

export default async function Home() {
  const user = await getSession()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <LoginForm />
    </main>
  )
}
