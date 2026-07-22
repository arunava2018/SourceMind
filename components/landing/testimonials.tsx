import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Testimonials() {
  const testimonials = [
    {
      quote: "ChaibookLM changed how I do literature reviews. I can upload 20 PDFs and instantly find connections between them with exact citations.",
      author: "Dr. Sarah Jenkins",
      role: "Research Scientist"
    },
    {
      quote: "I use this to study for exams. I upload all my lecture transcripts and slides, and it acts as the perfect personalized tutor.",
      author: "Michael Chen",
      role: "Computer Science Student"
    },
    {
      quote: "The ability to just drop a YouTube link and ask questions about a 2-hour lecture is mind-blowing. It saves me hours every week.",
      author: "Elena Rodriguez",
      role: "Product Manager"
    }
  ]

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Loved by researchers and students</h2>
          <p className="mt-3 text-muted-foreground">
            See how ChaibookLM is transforming the way people learn and work.
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-sm">
              <blockquote className="text-sm leading-relaxed text-muted-foreground">
                "{testimonial.quote}"
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t pt-6">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{testimonial.author}</div>
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
