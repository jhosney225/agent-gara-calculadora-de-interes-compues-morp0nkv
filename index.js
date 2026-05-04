
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

// Interfaz para entrada interactiva
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// Función para calcular interés compuesto
function calculateCompoundInterest(
  principal,
  rate,
  time,
  compoundingPeriods = 12
) {
  // A = P(1 + r/n)^(nt)
  const amount = principal * Math.pow(1 + rate / 100 / compoundingPeriods, compoundingPeriods * time);
  const interest = amount - principal;
  return {
    finalAmount: parseFloat(amount.toFixed(2)),
    interestEarned: parseFloat(interest.toFixed(2)),
    totalReturn: parseFloat(((interest / principal) * 100).toFixed(2)),
  };
}

// Función para generar análisis con Claude
async function getInvestmentAnalysis(investmentData) {
  const systemPrompt = `You are an expert financial advisor specializing in long-term compound interest investments. 
Provide clear, actionable insights about compound interest calculations and investment strategies.
Format your response with:
1. Summary of the calculation
2. Key insights about the investment growth
3. Practical recommendations for maximizing returns
4. Risk considerations and important disclaimers`;

  const userMessage = `Analyze this investment scenario:
- Principal Amount: $${investmentData.principal}
- Annual Interest Rate: ${investmentData.rate}%
- Investment Period: ${investmentData.time} years
- Compounding Frequency: ${investmentData.compoundingPeriods} times per year

The calculated results are:
- Final Amount: $${investmentData.result.finalAmount}
- Interest Earned: $${investmentData.result.interestEarned}
- Total Return: ${investmentData.result.totalReturn}%

Please provide a detailed analysis and recommendations for this investment.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
    system: systemPrompt,
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

// Función para formatear moneda
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Función para mostrar tabla de crecimiento año a año
function showGrowthTable(principal, rate, years, compoundingPeriods) {
  console.log("\n" + "=".repeat(80));
  console.log("YEAR-BY-YEAR INVESTMENT GROWTH");
  console.log("=".repeat(80));
  console.log(
    `${"Year":<6} ${"Balance":<20} ${"Interest Earned":<20} ${"Total Return %":<15}`
  );
  console.log("-".repeat(80));

  for (let year = 1; year <= years; year++) {
    const result = calculateCompoundInterest(principal, rate, year, compoundingPeriods);
    const yearlyInterest =
      year === 1
        ? result.interestEarned
        : result.interestEarned -
          calculateCompoundInterest(principal, rate, year - 1, compoundingPeriods)
            .interestEarned;

    console.log(
      `${year:<6} ${formatCurrency(result.finalAmount):<20} ${formatCurrency(yearlyInterest):<20} ${result.totalReturn.toFixed(2)}%`
    );
  }
  console.log("=".repeat(80));
}

// Función principal
async function main() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   COMPOUND INTEREST INVESTMENT        ║");
  console.log("║        CALCULATOR & ANALYZER          ║");
  console.log("╚════════════════════════════════════════╝\n");

  try {
    // Obtener datos de entrada
    const principalInput = await question(
      "Enter initial investment amount ($): "
    );
    const principal = parseFloat(principalInput);

    if (isNaN(principal) || principal <= 0) {
      console.error("Invalid principal amount");
      rl.close();
      return;
    }

    const rateInput = await question(
      "Enter annual interest rate (% per year): "
    );
    const rate = parseFloat(rateInput);

    if (isNaN(rate) || rate < 0) {
      console.error("Invalid interest rate");
      rl.close();
      return;
    }

    const timeInput = await question("Enter investment period (years): ");
    const time = parseInt(timeInput);

    if (isNaN(time) || time <= 0) {
      console.error("Invalid time period");
      rl.close();
      return;
    }

    const frequencyInput = await question(
      "Compounding frequency per year (1=annual, 2=semi-annual, 4=quarterly, 12=monthly, 365=daily) [default=12]: "
    );
    const compoundingPeriods = parseInt(frequencyInput) || 12;

    // Calcular interés compuesto
    const result = calculateCompoundInterest(principal, rate, time, compoundingPeriods);

    // Mostrar resultados
    console.log("\n" + "═".repeat(50));
    console.log("COMPOUND