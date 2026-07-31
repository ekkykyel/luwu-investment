with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""            ))}
          </div>
          <div className={`absolute inset-0 z-10 ${isDark ? "bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.8)_70%,#020617_100%)]" : "bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.8)_70%,#ffffff_100%)]"} pointer-events-none`} />""",
"""            ))}
          </motion.div>
          <div className={`absolute inset-0 z-10 ${isDark ? "bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.8)_70%,#020617_100%)]" : "bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.8)_70%,#ffffff_100%)]"} pointer-events-none`} />"""
)

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
