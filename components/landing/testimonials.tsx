import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star } from "lucide-react"

export function Testimonials() {
  const testimonials = [
    {
      quote:
        "ChaibookLM changed how I do literature reviews. I can upload 20 PDFs and instantly find connections between them with exact citations.",
      author: "Dr. Sarah Jenkins",
      role: "Research Scientist",
      rating: 5,
    },
    {
      quote:
        "I use this to study for exams. I upload all my lecture transcripts and slides, and it acts as the perfect personalized tutor.",
      author: "Michael Chen",
      role: "CS Graduate Student",
      rating: 5,
    },
    {
      quote:
        "The ability to just drop a YouTube link and ask questions about a 2-hour lecture is mind-blowing. It saves me hours every week.",
      author: "Elena Rodriguez",
      role: "Product Manager",
      rating: 5,
    },
  ]

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Testimonials
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by researchers and students
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            See how ChaibookLM is transforming the way people learn, research, and work.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="group flex flex-col justify-between rounded-xl border bg-background/80 p-6 transition-all hover:border-primary/30 hover:shadow-lg"
            >
              {/* Star rating */}
              <div>
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-foreground/80">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t pt-5">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{testimonial.author}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
