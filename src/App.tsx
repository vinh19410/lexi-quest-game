// Scaffold placeholder — the ui-shell screens land with the first UI stories
// (design/ux/interaction-patterns.md). No gameplay values may appear here;
// constants belong in src/game/constants/ per ADR-0004 §2.
export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold">LexiQuest</h1>
        <p className="mt-2 text-slate-400">
          Bộ khung ứng dụng — gameplay sẽ đến với các story đầu tiên.
        </p>
      </div>
    </main>
  );
}
