const tools = [
  "ChatGPT",
  "Claude",
  "Cursor",
  "Gemini",
  "GitHub Copilot",
  "OpenAI API",
  "Anthropic API",
  "Windsurf",
];

export default function SupportedTools() {
  return (
    <section className="border-t border-white/10 bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Works with your AI stack
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Analyze subscriptions, seats, and API usage across
            the most popular AI tools used by modern startups.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {tools.map((tool) => (
            <div
              key={tool}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-gray-300 backdrop-blur"
            >
              {tool}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}