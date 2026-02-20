import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Hono } from "npm:hono@3";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

// Health check
app.get("/", (c) => c.text("CCS Tabulation Server is live!"));

// Get current state
app.get("/state", async (c) => {
  const colleges = await kv.get("colleges") || [];
  const committees = await kv.get("committees") || [];
  const events = await kv.get("events") || [];
  const judges = await kv.get("judges") || [];
  const departments = await kv.get("departments") || [];
  const participants = await kv.get("participants") || [];
  const scores = await kv.get("scores") || [];
  
  return c.json({ colleges, committees, events, judges, departments, participants, scores });
});

// Update multiple states (batch sync)
app.post("/sync", async (c) => {
  try {
    const body = await c.req.json();
    const { colleges, committees, events, judges, departments, participants, scores } = body;

    const promises = [];
    if (colleges) promises.push(kv.set("colleges", colleges));
    if (committees) promises.push(kv.set("committees", committees));
    if (events) promises.push(kv.set("events", events));
    if (judges) promises.push(kv.set("judges", judges));
    if (departments) promises.push(kv.set("departments", departments));
    if (participants) promises.push(kv.set("participants", participants));
    if (scores) promises.push(kv.set("scores", scores));

    await Promise.all(promises);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Lock event (mark as completed)
app.post("/lock-event", async (c) => {
  try {
    const { eventId } = await c.req.json();
    const events = await kv.get("events") || [];
    const updatedEvents = events.map((e: any) => 
      e.id === eventId ? { ...e, status: "Completed" } : e
    );
    await kv.set("events", updatedEvents);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin Signup route
app.post("/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'admin' }
    });

    if (error) throw error;
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

serve(app.fetch);
