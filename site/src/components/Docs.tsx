import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import readme from "../../../README.md?raw";

export function Docs() {
  return (
    <section className="docs">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...rest }) => {
            const isExternal =
              href && (href.startsWith("http://") || href.startsWith("https://"));
            return (
              <a
                href={href}
                {...(isExternal
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                {...rest}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {readme}
      </ReactMarkdown>
    </section>
  );
}
