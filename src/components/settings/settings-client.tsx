"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { User, Lock, Palette, Bell, Globe, Loader2, Camera, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateProfile, updatePassword } from "@/actions/settings";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

interface SettingsClientProps {
  user: { id?: string; name?: string | null; email?: string | null; image?: string | null } | null;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { locale, setLocale } = useLocale();

  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [notifPrefs, setNotifPrefs] = useState({
    taskAssigned: true,
    taskDueSoon: true,
    commentOnTask: true,
    projectStatusChange: false,
    weeklyDigest: false,
    newTeamMember: false,
  });
  const [savingNotif, setSavingNotif] = useState(false);

  const handleSaveNotifications = async () => {
    setSavingNotif(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 500));
    setSavingNotif(false);
    toast.success(t("savePreferences") + " ✓");
  };

  return (
    <div className="max-w-2xl">
      <Tabs defaultValue="profile">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-3.5 w-3.5" /> {t("profile")}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-3.5 w-3.5" /> {t("security")}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-3.5 w-3.5" /> {t("appearance")}
          </TabsTrigger>
          <TabsTrigger value="language" className="gap-2">
            <Globe className="h-3.5 w-3.5" /> {t("language")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-3.5 w-3.5" /> {t("notifications")}
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <ProfileTab user={user} />
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <PasswordTab />
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t("appearanceTitle")}</CardTitle>
              <CardDescription>{t("appearanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">{t("themeLabel")}</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light", label: tc("light"), preview: "bg-white border-2" },
                    { value: "dark", label: tc("dark"), preview: "bg-slate-900 border-2" },
                    { value: "system", label: tc("system"), preview: "bg-gradient-to-br from-white to-slate-900 border-2" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setTheme(item.value)}
                      className={cn(
                        "rounded-xl p-4 border-2 transition-all text-left",
                        theme === item.value
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className={`h-12 rounded-lg mb-2 ${item.preview}`} />
                      <p className="text-sm font-medium">{item.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t("compactMode")}</p>
                    <p className="text-xs text-muted-foreground">{t("compactModeDesc")}</p>
                  </div>
                  <Switch
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t("animations")}</p>
                    <p className="text-xs text-muted-foreground">{t("animationsDesc")}</p>
                  </div>
                  <Switch
                    checked={animations}
                    onCheckedChange={setAnimations}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language */}
        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>{t("languageTitle")}</CardTitle>
              <CardDescription>{t("languageDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { code: "en", label: tc("english"), flag: "🇺🇸", desc: "English" },
                  { code: "id", label: tc("indonesian"), flag: "🇮🇩", desc: "Bahasa Indonesia" },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLocale(lang.code as "en" | "id")}
                    className={cn(
                      "rounded-xl p-4 border-2 transition-all text-left",
                      locale === lang.code
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="text-3xl mb-2">{lang.flag}</div>
                    <p className="text-sm font-semibold">{lang.label}</p>
                    <p className="text-xs text-muted-foreground">{lang.desc}</p>
                    {locale === lang.code && (
                      <span className="inline-block mt-1 text-xs text-primary font-medium">✓ Active</span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("notificationsTitle")}</CardTitle>
              <CardDescription>{t("notificationsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {(
                  [
                    { key: "taskAssigned", labelKey: "taskAssigned", descKey: "taskAssignedDesc" },
                    { key: "taskDueSoon", labelKey: "taskDueSoon", descKey: "taskDueSoonDesc" },
                    { key: "commentOnTask", labelKey: "commentOnTask", descKey: "commentOnTaskDesc" },
                    { key: "projectStatusChange", labelKey: "projectStatusChange", descKey: "projectStatusChangeDesc" },
                    { key: "weeklyDigest", labelKey: "weeklyDigest", descKey: "weeklyDigestDesc" },
                    { key: "newTeamMember", labelKey: "newTeamMember", descKey: "newTeamMemberDesc" },
                  ] as const
                ).map((n) => (
                  <div key={n.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t(n.labelKey)}</p>
                      <p className="text-xs text-muted-foreground">{t(n.descKey)}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[n.key]}
                      onCheckedChange={(v) =>
                        setNotifPrefs((prev) => ({ ...prev, [n.key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <Button onClick={handleSaveNotifications} disabled={savingNotif}>
                  {savingNotif ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />{t("saving")}</> : t("savePreferences")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab({ user }: { user: SettingsClientProps["user"] }) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("settings");
  const [values, setValues] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await updateProfile(values);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("profileSaved"));
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profileTitle")}</CardTitle>
        <CardDescription>{t("profileDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.image ?? ""} />
              <AvatarFallback className="text-lg">{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("displayName")}</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("emailAddress")}</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />{t("saving")}</>
            ) : (
              t("saveProfile")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordTab() {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("settings");
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values.newPassword !== values.confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }
    setIsLoading(true);
    try {
      const result = await updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("passwordUpdated"));
        setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      toast.error("Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("securityTitle")}</CardTitle>
        <CardDescription>{t("securityDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">{t("currentPassword")}</Label>
            <Input
              id="current-password"
              type="password"
              value={values.currentPassword}
              onChange={(e) => setValues((p) => ({ ...p, currentPassword: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">{t("newPassword")}</Label>
            <Input
              id="new-password"
              type="password"
              value={values.newPassword}
              onChange={(e) => setValues((p) => ({ ...p, newPassword: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={values.confirmPassword}
              onChange={(e) => setValues((p) => ({ ...p, confirmPassword: e.target.value }))}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />{t("saving")}</> 
            ) : (
              t("updatePassword")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
