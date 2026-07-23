import type { ChangeEvent, FormEvent, RefObject } from "react";
import { Upload } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/features/profile/components/UserAvatar";

export type ProfileEditSection =
  "general" | "avatar" | "connections" | "privacy" | "preferences" | "account";

type CommentsPermission = "public" | "friends" | "disabled";

interface ProfileEditContentProps {
  section: ProfileEditSection;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  steamId: string;
  profileVisibility: string;
  libraryVisibility: string;
  reviewsVisibility: string;
  commentsPermission: CommentsPermission;
  matureEnabled: boolean;
  uploading: boolean;
  saving: boolean;
  deleting: boolean;
  deleteText: string;
  fileInput: RefObject<HTMLInputElement | null>;
  onDisplayNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSteamIdChange: (value: string) => void;
  onProfileVisibilityChange: (value: string) => void;
  onLibraryVisibilityChange: (value: string) => void;
  onReviewsVisibilityChange: (value: string) => void;
  onCommentsPermissionChange: (value: CommentsPermission) => void;
  onMatureEnabledChange: (value: boolean) => void;
  onDeleteTextChange: (value: string) => void;
  onSaveGeneral: (event: FormEvent) => void;
  onUploadAvatar: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveSteam: () => void;
  onSavePrivacy: () => void;
  onDeleteAccount: () => void;
}

const visibilityOptions = [
  { value: "public", label: "Público" },
  { value: "friends", label: "Somente amigos" },
  { value: "private", label: "Privado" },
];

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function VisibilityField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_14rem] sm:items-center">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
      >
        {visibilityOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Apenas apresenta os formulários. Carregamento, autenticação e persistência
 * continuam na página controladora `ProfileEdit`.
 */
export function ProfileEditContent(props: ProfileEditContentProps) {
  if (props.section === "general") {
    return (
      <form onSubmit={props.onSaveGeneral} className="max-w-2xl space-y-6">
        <SectionTitle title="Geral" description="Nome, endereço do perfil e apresentação." />
        <div className="space-y-2">
          <Label>Nome de exibição</Label>
          <Input
            value={props.displayName}
            onChange={(event) => props.onDisplayNameChange(event.target.value)}
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <Label>Username</Label>
          <Input
            value={props.username}
            onChange={(event) =>
              props.onUsernameChange(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground">
            spotlight.app/u/{props.username || "seu_username"}
          </p>
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea
            value={props.bio}
            onChange={(event) => props.onBioChange(event.target.value)}
            maxLength={300}
          />
        </div>
        <Button type="submit" disabled={props.saving}>
          Salvar alterações
        </Button>
      </form>
    );
  }

  if (props.section === "avatar") {
    return (
      <div className="max-w-xl space-y-6">
        <SectionTitle
          title="Avatar"
          description="A imagem exibida no seu perfil e na comunidade."
        />
        <UserAvatar
          src={props.avatarUrl}
          displayName={props.displayName}
          username={props.username}
          size="xl"
          shape="square"
          className="h-40 w-40"
        />
        <input
          ref={props.fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={props.onUploadAvatar}
        />
        <Button
          onClick={() => props.fileInput.current?.click()}
          disabled={props.uploading}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {props.uploading ? "Enviando..." : "Alterar avatar"}
        </Button>
        <p className="text-xs text-muted-foreground">PNG, JPG ou WebP. Máximo de 2 MB.</p>
      </div>
    );
  }

  if (props.section === "connections") {
    return (
      <div className="max-w-2xl space-y-6">
        <SectionTitle
          title="Contas conectadas"
          description="Identificadores usados para importar sua atividade."
        />
        <div className="space-y-2">
          <Label>Perfil ou Steam ID</Label>
          <Input
            value={props.steamId}
            onChange={(event) => props.onSteamIdChange(event.target.value)}
            placeholder="https://steamcommunity.com/id/..."
          />
        </div>
        <Button onClick={props.onSaveSteam}>Salvar Steam</Button>
        <div className="border-t border-border/40 pt-5 text-sm text-muted-foreground">
          Xbox e PlayStation serão configurados aqui quando as integrações estiverem disponíveis.
        </div>
      </div>
    );
  }

  if (props.section === "privacy") {
    return (
      <div className="max-w-2xl space-y-6">
        <SectionTitle
          title="Privacidade"
          description="Escolha quem pode acessar cada parte do perfil."
        />
        <VisibilityField
          label="Perfil"
          value={props.profileVisibility}
          onChange={props.onProfileVisibilityChange}
        />
        <VisibilityField
          label="Biblioteca"
          value={props.libraryVisibility}
          onChange={props.onLibraryVisibilityChange}
        />
        <VisibilityField
          label="Avaliações"
          value={props.reviewsVisibility}
          onChange={props.onReviewsVisibilityChange}
        />
        <div className="grid gap-2 sm:grid-cols-[1fr_14rem] sm:items-center">
          <Label>Comentários</Label>
          <select
            value={props.commentsPermission}
            onChange={(event) =>
              props.onCommentsPermissionChange(event.target.value as CommentsPermission)
            }
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="public">Todos conectados</option>
            <option value="friends">Somente amigos</option>
            <option value="disabled">Desativados</option>
          </select>
        </div>
        <Button onClick={props.onSavePrivacy}>Salvar privacidade</Button>
      </div>
    );
  }

  if (props.section === "preferences") {
    return (
      <div className="max-w-2xl space-y-7">
        <SectionTitle title="Preferências" description="Idioma e conteúdo exibido no SpotLight." />
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Idioma</Label>
            <p className="text-xs text-muted-foreground">Idioma da interface e dos jogos.</p>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-5">
          <div>
            <Label>Conteúdo adulto</Label>
            <p className="text-xs text-muted-foreground">
              Mostrar jogos classificados como conteúdo adulto.
            </p>
          </div>
          <Switch checked={props.matureEnabled} onCheckedChange={props.onMatureEnabledChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <SectionTitle title="Conta" description="Ações permanentes relacionadas à sua conta." />
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5">
        <h2 className="font-medium text-destructive">Excluir conta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta ação remove permanentemente seu perfil e seus dados.
        </p>
        <Input
          className="mt-4"
          value={props.deleteText}
          onChange={(event) => props.onDeleteTextChange(event.target.value)}
          placeholder="Digite EXCLUIR"
        />
        <Button
          variant="destructive"
          className="mt-3"
          disabled={props.deleteText !== "EXCLUIR" || props.deleting}
          onClick={props.onDeleteAccount}
        >
          Excluir minha conta
        </Button>
      </div>
    </div>
  );
}
