import { FastifyInstance } from "fastify"
import { z } from "zod"
import { knex } from "../database"
import crypto, { randomUUID } from "node:crypto"
import { checkSessionIdExists } from "../middlewares/check-session-id-exists"

// TESTES
// Unitários: unidade da nossa aplicação
// Integração: comunicação entre duas ou mais unidades
// E2E - ponta a ponta/end to end: simulam um usuário operando na nossa aplicação

// front-end: abre a página de login, digite o texto gustavo@gmail.com.br no campo com ID email, clique no botão tal
// back-end: chamadas HTTP, WebSockets

// Os testes E2E tem um custo alto de processamento

export async function transactionsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: checkSessionIdExists }, async (request) => {
    const { sessionId } = request.cookies

    const transactions = await knex("transactions")
      .where("session_id", sessionId)
      .select()

    return { transactions }
  })

  app.get("/:id", { preHandler: checkSessionIdExists }, async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionParamsSchema.parse(request.params)

    const { sessionId } = request.cookies

    const transaction = await knex("transactions")
      .where({ session_id: sessionId, id })
      .first()

    return { transaction }
  })

  app.get("/summary", { preHandler: checkSessionIdExists }, async (request) => {
    const { sessionId } = request.cookies

    const summary = await knex("transactions")
      .where("session_id", sessionId)
      .sum("amount", { as: "amount" })
      .first()

    return { summary }
  })

  app.post("/", async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    })

    const { amount, title, type } = createTransactionBodySchema.parse(
      request.body
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex("transactions").insert({
      id: crypto.randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId,
    })

    reply.status(201).send()
  })
}
