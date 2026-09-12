import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { StructureView } from "@/components/StructureView";
import { BookIcon, HexIcon, PencilIcon, TagIcon } from "@/components/Icons";
import { MOLECULES } from "@/lib/molecules";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Organic Nomenclature Studio — IUPAC Naming Practice" },
      {
        name: "description",
        content:
          "Practice organic chemistry naming both ways: draw a structure from an IUPAC name, or name a structure you see. Self-paced, no sign-in.",
      },
      { property: "og:title", content: "Organic Nomenclature Studio" },
      {
        property: "og:description",
        content:
          "Two-way IUPAC nomenclature practice with hints, feedback and instructor controls.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const demo = MOLECULES.find((m) => m.id === "2-methylbutane") ?? MOLECULES[0]!;
  return (
    <Shell>
      <section className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <HexIcon className="size-3.5" /> Organic chemistry practice activity
          </p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
            Learn IUPAC names in both directions.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Work through short, self-paced sets that alternate between building a structure from a
            name and naming a structure you are shown. Hints, three attempts, and a worked
            explanation on every question.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/practice"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start practicing
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No account needed. Your progress is stored on this device only.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sample structure
          </p>
          <div className="mt-4 flex justify-center">
            <StructureView structure={demo.structure} title={demo.displayName} className="w-64" />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            What is this molecule called?
          </p>
          <p className="mt-1 text-center font-display text-lg font-semibold">{demo.displayName}</p>
        </div>
      </section>

      <section className="mt-14 grid gap-5 sm:grid-cols-2">
        <ModeCard
          icon={<PencilIcon className="size-5" />}
          title="Draw from a Name"
          body="You get an IUPAC name and choose or enter the structure it describes — chain length, branch positions, functional group placement."
        />
        <ModeCard
          icon={<TagIcon className="size-5" />}
          title="Name from a Structure"
          body="You get a skeletal structure and type its systematic name. Common names such as acetone can be accepted or rejected by your instructor."
        />
      </section>

      <section className="mt-12 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-accent">
            <BookIcon className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Ready to embed in your course</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              This standalone activity can be embedded in a Canvas page or launched as an external
              link, and students can export a JSON summary of a completed set. It does not provide
              native Canvas grade passback or LTI support — automatic grade sync would need a later
              LTI integration.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">What the bank covers</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {[...new Set(MOLECULES.map((m) => m.topic))].map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {MOLECULES.length} molecules across three difficulty tiers.
        </p>
      </section>
    </Shell>
  );
}

function ModeCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
        {icon}
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
