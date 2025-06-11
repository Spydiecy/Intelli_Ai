import openai

# Create the OpenAI client, pointing to your Gaia node
client = openai.OpenAI(
    base_url="https://qwen7b.gaia.domains/v1",
    api_key="gaia-ZjhjODBhN2UtYjVhOS00ZTUxLThmN2EtMDFiMmU4NTZhYzE2-7rZC0V20r0vuEAJg"
)

def call_openai():
    try:
        response = client.chat.completions.create(
            model="Meta-Llama-3-8B-Instruct-Q5_K_M",  # Replace with your node's model name if different
            messages=[
                {"role": "system", "content": "You are a strategic reasoner."},
                {"role": "user", "content": "What is the purpose of life?"}
            ],
            temperature=0.7,
            max_tokens=500
        )
        print(response.choices[0].message.content)
    except Exception as e:
        print("Error:", e)

# Usage
call_openai()
