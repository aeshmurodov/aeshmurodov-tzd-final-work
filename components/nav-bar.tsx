"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { LogOut, Menu, X, Moon, Sun, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface NavBarProps {
  user?: {
    username: string
    role: string
    full_name?: string
  }
}

export function NavBar({ user }: NavBarProps) {
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10 text-primary" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                ЗЭДКД
              </h1>
              <p className="text-xs text-muted-foreground">Защищенный документооборот</p>
            </div>
          </div>

          {/* Desktop Menu */}
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">{user.full_name || user.username}</div>
                <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
              </div>

              <Button variant="outline" size="icon" asChild>
                <Link href="/profile">
                  <Settings className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">Настройки профиля</span>
                </Link>
              </Button>

              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Переключить тему</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>Светлая</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>Темная</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>Системная</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Выход
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        {user && mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t space-y-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">{user.full_name || user.username}</div>
              <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                <Link href="/profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Настройки
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex-1"
              >
                {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {theme === "dark" ? "Светлая" : "Темная"}
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full bg-transparent">
              <LogOut className="mr-2 h-4 w-4" />
              Выход
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
