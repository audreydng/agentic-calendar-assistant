"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";

const styles = {
  root: "flex h-svh overflow-hidden",
  aside:
    "fixed inset-y-0 left-0 z-40 flex w-[18.5rem] flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl transition-transform md:static md:translate-x-0",
  brandRow: "flex items-center justify-between gap-2 px-4 pt-4 pb-3",
  brandLeft: "flex min-w-0 items-center gap-2.5",
  brandIcon:
    "flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground",
  brandIconSvg: "size-4",
  brandText: "min-w-0",
  brandTitle: "font-heading text-lg font-semibold tracking-tight",
  topActions: "space-y-3 px-3 pb-3",
  separator: "opacity-70",
  chatsSection: "flex min-h-0 flex-1 flex-col px-2 pt-3",
  chatsTitle: "mb-2 px-2 text-sm font-semibold text-sidebar-foreground",
  chatsEmpty: "px-2 py-3 text-sm leading-relaxed text-muted-foreground",
  footer: "mt-auto border-t border-sidebar-border p-3",
  main: "relative flex min-w-0 flex-1 flex-col",
  header:
    "flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/50 px-3 backdrop-blur-md md:px-5",
  headerText: "min-w-0",
  headerTitle: "truncate text-base font-semibold",
  headerSubtitle: "truncate text-sm text-muted-foreground",
  chatColumn: "relative flex min-h-0 flex-1 flex-col",
  messagesScroll: "h-full min-h-0 flex-1",
  messagesInner: "mx-auto w-full max-w-3xl px-4 py-8 sm:px-6",
  emptyState:
    "flex min-h-[52vh] flex-col items-center justify-center text-center",
  emptyIcon:
    "mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground",
  emptyIconSvg: "size-6",
  emptyTitle: "font-heading text-3xl font-semibold tracking-tight sm:text-4xl",
  emptyCopy: "mt-3 max-w-md text-base leading-relaxed text-muted-foreground",
  composerWrap:
    "shrink-0 border-t border-border/60 bg-background/70 px-4 py-4 backdrop-blur-md sm:px-6",
  composerForm:
    "composer-glow mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-border/80 bg-card p-2.5",
  composerInput:
    "max-h-40 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-[15px] shadow-none focus-visible:ring-0",
  sendBtn: "mb-0.5 size-10 shrink-0 rounded-xl",
  sendIcon: "size-4",
} as const;

type Props = {
  connections?: ReactNode;
  footer?: ReactNode;
};

const WELCOME =
  "Connect Google Calendar to prepare your scheduling assistant.";

function ChatPanel({ connections, footer }: Props) {
  return (
    <div className={styles.root}>
      <aside className={styles.aside}>
        <div className={styles.brandRow}>
          <div className={styles.brandLeft}>
            <div className={styles.brandIcon}>
              <Sparkles className={styles.brandIconSvg} />
            </div>
            <div className={styles.brandText}>
              <p className={styles.brandTitle}>Meet Agent</p>
            </div>
          </div>
        </div>

        <div className={styles.topActions}>{connections}</div>
        <Separator className={styles.separator} />
        <div className={styles.chatsSection}>
          <p className={styles.chatsTitle}>Chats</p>
          <p className={styles.chatsEmpty}>
            Chat history will be available after the agent integration.
          </p>
        </div>
        <Separator className={styles.separator} />

        <div className={styles.footer}>{footer}</div>
      </aside>

      <section className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.headerTitle}>Assistant</p>
            <p className={styles.headerSubtitle}>
              Schedule, reschedule, and brief your day
            </p>
          </div>
        </header>

        <div className={styles.chatColumn}>
          <ScrollArea className={styles.messagesScroll}>
            <div className={styles.messagesInner}>
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Sparkles className={styles.emptyIconSvg} />
                </div>
                <h2 className={styles.emptyTitle}>Meeting Assistant</h2>
                <p className={styles.emptyCopy}>{WELCOME}</p>
              </div>
            </div>
          </ScrollArea>

          <div className={styles.composerWrap}>
            <div className={styles.composerForm}>
              <Textarea
                rows={1}
                disabled
                placeholder="Agent chat is coming in the next step..."
                className={styles.composerInput}
              />
              <Button
                type="button"
                size="icon"
                disabled
                className={styles.sendBtn}
                aria-label="Send Text Message"
              >
                <ArrowUp className={styles.sendIcon} />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ChatPanel;
