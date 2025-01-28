import { expect, it, beforeAll, afterAll, describe, beforeEach } from "vitest"
import { execSync } from "node:child_process"
import request from "supertest"
import { app } from "../src/app"

// jamais escrever um teste que depende de outro teste, os contextos devem ser isolados

describe("Transactions routes", () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync("npm run migrate:rollback all")
    execSync("npm run migrate:latest")
  })

  // e2e tem que ser poucos e bons, pois são lentos

  it("should be able to create a new transaction", async () => {
    // fazer a chamada HTTP p/ criar uma nova transação e já validar
    const response = await request(app.server)
      .post("/transactions")
      .send({ title: "New Transaction", amount: 5000, type: "credit" })
      .expect(201)
  })

  it("should be able to list all transactions", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({ title: "New Transaction", amount: 5000, type: "credit" })
      .expect(201)

    const cookies = createTransactionResponse.get("Set-Cookie")

    if (!cookies) {
      return 404
    }

    const listTransactionsResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({ title: "New Transaction", amount: 5000 }),
    ])
  })

  it("should be able to get a specific transaction", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({ title: "New Transaction", amount: 5000, type: "credit" })
      .expect(201)

    const cookies = createTransactionResponse.get("Set-Cookie")

    if (!cookies) {
      return 404
    }

    const listTransactionsResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({ title: "New Transaction", amount: 5000 })
    )
  })

  it("should be able to get the summary", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({ title: "Credit Transaction", amount: 5000, type: "credit" })
      .expect(201)

    const cookies = createTransactionResponse.get("Set-Cookie")

    if (!cookies) {
      return "No cookies found"
    }

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({ title: "Debit Transaction", amount: 2000, type: "debit" })
      .expect(201)

    const summaryResponse = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    })
  })
})
