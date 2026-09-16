"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Home,
  Info,
  Keyboard,
  Mail,
  Map,
  Newspaper,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  SunMoon,
  Timer,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { navigate } from "@/lib/focusly/router";
import { useFocusly } from "@/lib/focusly/store";

interface NavItem {
  route: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { route: "accueil", label: "Accueil", icon: Home },
  { route: "outils", label: "Outils", icon: Timer },
  { route: "guide", label: "Guide", icon: BookOpen },
  { route: "blog", label: "Blog", icon: Newspaper },
  { route: "a-propos", label: "À propos", icon: Info },
  { route: "contact", label: "Contact", icon: Mail },
  { route: "plan-du-site", label: "Plan du site", icon: Map },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpenCommand = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("focusly:open-command", onOpenCommand);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("focusly:open-command", onOpenCommand);
    };
  }, []);

  // Snapshot read at render (refreshed each time the palette re-renders on open):
  // picks the Play/Pause icon without subscribing the always-mounted palette.
  const running = useFocusly.getState().running;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Palette de commandes"
      description="Recherchez une page ou une action à exécuter."
    >
      <CommandInput placeholder="Rechercher une page ou une action…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.route}
              onSelect={() => {
                navigate(item.route);
                setOpen(false);
              }}
            >
              <item.icon />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Minuteur">
          <CommandItem
            onSelect={() => {
              const state = useFocusly.getState();
              if (state.running) state.pauseTimer();
              else state.startTimer();
              setOpen(false);
            }}
          >
            {running ? <Pause /> : <Play />}
            Démarrer ou mettre en pause le minuteur
          </CommandItem>
          <CommandItem
            onSelect={() => {
              useFocusly.getState().resetTimer();
              setOpen(false);
            }}
          >
            <RotateCcw />
            Réinitialiser le minuteur
          </CommandItem>
          <CommandItem
            onSelect={() => {
              useFocusly.getState().skipMode();
              setOpen(false);
            }}
          >
            <SkipForward />
            Passer au mode suivant
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Application">
          <CommandItem
            onSelect={() => {
              useFocusly.getState().toggleTheme();
              setOpen(false);
            }}
          >
            <SunMoon />
            Basculer le thème clair / sombre
          </CommandItem>
          <CommandItem
            onSelect={() => {
              useFocusly.getState().setSettingsOpen(true);
              setOpen(false);
            }}
          >
            <Settings2 />
            Ouvrir les réglages
          </CommandItem>
          <CommandItem
            onSelect={() => {
              useFocusly.getState().setHelpOpen(true);
              setOpen(false);
            }}
          >
            <Keyboard />
            Raccourcis clavier
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
