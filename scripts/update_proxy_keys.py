path = 'frontend/src/proxy.ts'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = """if (typeof process !== "undefined" && process.env) {
  if (isBrokenClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_Y29vbC1sb2JzdGVyLTguY2xlcmsuYWNjb3VudHMuZGV2JA";
  }
  if (isBrokenClerkKey(process.env.CLERK_PUBLISHABLE_KEY)) {
    process.env.CLERK_PUBLISHABLE_KEY = "pk_test_Y29vbC1sb2JzdGVyLTguY2xlcmsuYWNjb3VudHMuZGV2JA";
  }
  if (!process.env.CLERK_SECRET_KEY || isBrokenClerkKey(process.env.CLERK_SECRET_KEY)) {
    process.env.CLERK_SECRET_KEY = "sk_test_aJ5w4a5QHqS3UiaxXzFR64HA2fIZViqiQEM5MwZtE0";
  }
}"""

replacement = """if (typeof process !== "undefined" && process.env) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || isBrokenClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_Y29vbC1sb2JzdGVyLTguY2xlcmsuYWNjb3VudHMuZGV2JA";
  }
  if (!process.env.CLERK_PUBLISHABLE_KEY || isBrokenClerkKey(process.env.CLERK_PUBLISHABLE_KEY)) {
    process.env.CLERK_PUBLISHABLE_KEY = "pk_test_Y29vbC1sb2JzdGVyLTguY2xlcmsuYWNjb3VudHMuZGV2JA";
  }
  if (!process.env.CLERK_SECRET_KEY || isBrokenClerkKey(process.env.CLERK_SECRET_KEY)) {
    process.env.CLERK_SECRET_KEY = "sk_test_aJ5w4a5QHqS3UiaxXzFR64HA2fIZViqiQEM5MwZtE0";
  }
}"""

text = text.replace(target, replacement)
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated proxy.ts")

