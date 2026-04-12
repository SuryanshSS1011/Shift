EcoLogits API

{"openapi":"3.1.0","info":{"title":"EcoLogits API","description":"**EcoLogits API** provides a language-agnostic HTTP interface to the\n[EcoLogits](https://ecologits.ai) library, so any stack — not just Python — can\nestimate the environmental footprint of generative-AI inference.\n\n## What is EcoLogits?\n\nEcoLogits is an open-source project (part of the CodeCarbon non-profit) that estimates\nthe environmental impacts of AI model usage at inference time.\nIt follows Life Cycle Assessment (LCA) principles defined by ISO 14044.\n\n## Environmental metrics\n\n| Metric | Unit | Description |\n|---|---|---|\n| **Energy** | kWh | Energy consumed by the request |\n| **GWP** (Global Warming Potential) | kgCO₂eq | Greenhouse gas emissions |\n| **ADPe** (Abiotic Depletion Potential) | kgSbeq | Mineral & metal resource depletion |\n| **PE** (Primary Energy) | MJ | Total primary energy consumed |\n| **WCF** (Water Consumption Footprint) | L | Fresh water consumed by data centers and power generation, not returned to its source |\n\nResults are returned as **approximation intervals** (min/max range), not single point estimates.\n\n## Useful links\n\n- [EcoLogits documentation](https://ecologits.ai/)\n- [Methodology](https://ecologits.ai/latest/methodology/)\n- [GitHub repository](https://github.com/mlco2/ecologits)\n","contact":{"name":"EcoLogits","url":"https://ecologits.ai/"},"version":"0.0.1beta"},"paths":{"/v1beta/providers":{"get":{"tags":["Catalog"],"summary":"List all supported providers","operationId":"get_providers_v1beta_providers_get","responses":{"200":{"description":"List of provider identifiers.","content":{"application/json":{"schema":{"additionalProperties":true,"type":"object","title":"Response Get Providers V1Beta Providers Get"},"example":{"providers":["anthropic","mistralai","openai","huggingface_hub","cohere","google_genai"]}}}}}}},"/v1beta/models/{provider_name}":{"get":{"tags":["Catalog"],"summary":"List models for a provider","description":"Models may include **warning** and **error** indicators ([details](https://ecologits.ai/latest/tutorial/warnings_and_errors/)).","operationId":"get_models_v1beta_models**provider_name**get","parameters":[{"name":"provider_name","in":"path","required":true,"schema":{"type":"string","title":"Provider Name"}}],"responses":{"200":{"description":"List of models for the provider.","content":{"application/json":{"schema":{"type":"object","additionalProperties":true,"title":"Response Get Models V1Beta Models Provider Name Get"},"example":{"models":[{"provider":"openai","name":"gpt-4o-mini","architecture":{"type":"moe","parameters":{"total":440,"active":{"min":44,"max":132}}},"warnings":[{"code":"model-arch-not-released","message":"The model architecture has not been released, expect lower precision."}],"sources":[]}]}}}},"404":{"description":"Provider not found.","content":{"application/json":{"example":{"detail":"Provider not found"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/v1beta/electricity-mix-zones/{zone}":{"get":{"tags":["Electricity mix"],"summary":"Get electricity mix for a zone","description":"Use ISO 3166-1 alpha-3 codes (`USA`, `FRA`, `DEU`) (or `WOR` for World average).","operationId":"get_electricity_mix_zones_v1beta_electricity_mix_zones__zone__get","parameters":[{"name":"zone","in":"path","required":true,"schema":{"type":"string","title":"Zone"}}],"responses":{"200":{"description":"Electricity mix composition for the specified zone.","content":{"application/json":{"schema":{"type":"object","additionalProperties":true,"title":"Response Get Electricity Mix Zones V1Beta Electricity Mix Zones  Zone  Get"},"example":{"electricity_mix":{"zone":"FRA","adpe":4.858e-08,"pe":9.3135,"gwp":0.04418,"wue":3.6737}}}}},"404":{"description":"Zone not supported by EcoLogits.","content":{"application/json":{"example":{"detail":"Electricity mix zone 'XYZ' is not supported by EcoLogits"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}},"/v1beta/estimations":{"post":{"tags":["Estimations"],"summary":"Estimate environmental impacts of an LLM request","operationId":"post_estimations_v1beta_estimations_post","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/Body_post_estimations_v1beta_estimations_post"}}},"required":true},"responses":{"200":{"description":"Environmental impact estimation with min/max intervals.","content":{"application/json":{"schema":{"additionalProperties":true,"type":"object","title":"Response Post Estimations V1Beta Estimations Post"},"example":{"impacts":{"energy":{"type":"energy","name":"Energy","value":{"min":1.740232832301384e-05,"max":2.1502108309942407e-05},"unit":"kWh"},"gwp":{"type":"GWP","name":"Global Warming Potential","value":{"min":8.448613075332601e-06,"max":1.0387850006949683e-05},"unit":"kgCO2eq"},"adpe":{"type":"ADPe","name":"Abiotic Depletion Potential (elements)","value":{"min":1.2955834115064265e-11,"max":1.3011140147087931e-11},"unit":"kgSbeq"},"pe":{"type":"PE","name":"Primary Energy","value":{"min":4.76420806326274e-05,"max":5.82486214368103e-05},"unit":"MJ"},"wcf":{"type":"WCF","name":"Water Consumption Footprint","value":{"min":9.151188371940057e-05,"max":0.00011307098675866313},"unit":"L"},"usage":{"type":"usage","name":"Usage","energy":{"type":"energy","name":"Energy","value":{"min":1.740232832301384e-05,"max":2.1502108309942407e-05},"unit":"kWh"},"gwp":{"type":"GWP","name":"Global Warming Potential","value":{"min":8.231475320068776e-06,"max":1.0170712251685857e-05},"unit":"kgCO2eq"},"adpe":{"type":"ADPe","name":"Abiotic Depletion Potential (elements)","value":{"min":2.3475740907745673e-13,"max":2.9006344110112307e-13},"unit":"kgSbeq"},"pe":{"type":"PE","name":"Primary Energy","value":{"min":4.5021563604469106e-05,"max":5.5628104408652e-05},"unit":"MJ"},"wcf":{"type":"WCF","name":"Water Consumption Footprint","value":{"min":9.151188371940057e-05,"max":0.00011307098675866313},"unit":"L"}},"embodied":{"type":"embodied","name":"Embodied","gwp":{"type":"GWP","name":"Global Warming Potential","value":{"min":2.1713775526382546e-07,"max":2.1713775526382546e-07},"unit":"kgCO2eq"},"adpe":{"type":"ADPe","name":"Abiotic Depletion Potential (elements)","value":{"min":1.2721076705986809e-11,"max":1.2721076705986809e-11},"unit":"kgSbeq"},"pe":{"type":"PE","name":"Primary Energy","value":{"min":2.6205170281582953e-06,"max":2.6205170281582953e-06},"unit":"MJ"}},"warnings":[{"code":"model-arch-not-released","message":"The model architecture has not been released, expect lower precision."},{"code":"model-arch-multimodal","message":"The model architecture is multimodal, expect lower precision."}]}}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}}},"components":{"schemas":{"Body_post_estimations_v1beta_estimations_post":{"properties":{"provider":{"type":"string","title":"Provider","description":"Provider identifier (use `GET /v1beta/providers` to list valid values).","examples":["openai"]},"model_name":{"type":"string","title":"Model Name","description":"Model identifier as registered in EcoLogits (use `GET /v1beta/models/{provider}` to list valid values).","examples":["gpt-4o-mini"]},"output_token_count":{"type":"integer","title":"Output Token Count","description":"Number of tokens generated by the model.","examples":[300]},"request_latency":{"type":"number","title":"Request Latency","description":"Measured request latency in seconds.","examples":[1.5]},"electricity_mix_zone":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Electricity Mix Zone","description":"ISO 3166-1 alpha-3 zone code for the electricity mix. Defaults to `WOR` (world average). (use `GET /v1beta/electricity-mix-zones/{zone}` to check zone availability)","examples":["WOR"]}},"type":"object","required":["provider","model_name","output_token_count","request_latency"],"title":"Body_post_estimations_v1beta_estimations_post"},"HTTPValidationError":{"properties":{"detail":{"items":{"$ref":"#/components/schemas/ValidationError"},"type":"array","title":"Detail"}},"type":"object","title":"HTTPValidationError"},"ValidationError":{"properties":{"loc":{"items":{"anyOf":[{"type":"string"},{"type":"integer"}]},"type":"array","title":"Location"},"msg":{"type":"string","title":"Message"},"type":{"type":"string","title":"Error Type"},"input":{"title":"Input"},"ctx":{"type":"object","title":"Context"}},"type":"object","required":["loc","msg","type"],"title":"ValidationError"}}},"tags":[{"name":"Estimations","description":"Estimate the environmental impacts of an LLM inference request."},{"name":"Catalog","description":"Browse the AI providers and models supported by EcoLogits. Use these endpoints to discover valid values for the estimation request."},{"name":"Electricity mix","description":"Retrieve the electricity mix composition for a given geographic zone. This data is used to calculate carbon impacts."}]}

/v1beta/estimations

{
"provider": "openai",
"model_name": "gpt-4o-mini",
"output_token_count": 300,
"request_latency": 1.5,
"electricity_mix_zone": "WOR"
}

output:

{
"impacts": {
"energy": {
"type": "energy",
"name": "Energy",
"value": {
"min": 0.00001740232832301384,
"max": 0.000021502108309942407
},
"unit": "kWh"
},
"gwp": {
"type": "GWP",
"name": "Global Warming Potential",
"value": {
"min": 0.000008448613075332601,
"max": 0.000010387850006949683
},
"unit": "kgCO2eq"
},
"adpe": {
"type": "ADPe",
"name": "Abiotic Depletion Potential (elements)",
"value": {
"min": 1.2955834115064265e-11,
"max": 1.3011140147087931e-11
},
"unit": "kgSbeq"
},
"pe": {
"type": "PE",
"name": "Primary Energy",
"value": {
"min": 0.0000476420806326274,
"max": 0.0000582486214368103
},
"unit": "MJ"
},
"wcf": {
"type": "WCF",
"name": "Water Consumption Footprint",
"value": {
"min": 0.00009151188371940057,
"max": 0.00011307098675866313
},
"unit": "L"
},
"usage": {
"type": "usage",
"name": "Usage",
"energy": {
"type": "energy",
"name": "Energy",
"value": {
"min": 0.00001740232832301384,
"max": 0.000021502108309942407
},
"unit": "kWh"
},
"gwp": {
"type": "GWP",
"name": "Global Warming Potential",
"value": {
"min": 0.000008231475320068776,
"max": 0.000010170712251685857
},
"unit": "kgCO2eq"
},
"adpe": {
"type": "ADPe",
"name": "Abiotic Depletion Potential (elements)",
"value": {
"min": 2.3475740907745673e-13,
"max": 2.9006344110112307e-13
},
"unit": "kgSbeq"
},
"pe": {
"type": "PE",
"name": "Primary Energy",
"value": {
"min": 0.000045021563604469106,
"max": 0.000055628104408652
},
"unit": "MJ"
},
"wcf": {
"type": "WCF",
"name": "Water Consumption Footprint",
"value": {
"min": 0.00009151188371940057,
"max": 0.00011307098675866313
},
"unit": "L"
}
},
"embodied": {
"type": "embodied",
"name": "Embodied",
"gwp": {
"type": "GWP",
"name": "Global Warming Potential",
"value": {
"min": 2.1713775526382546e-7,
"max": 2.1713775526382546e-7
},
"unit": "kgCO2eq"
},
"adpe": {
"type": "ADPe",
"name": "Abiotic Depletion Potential (elements)",
"value": {
"min": 1.2721076705986809e-11,
"max": 1.2721076705986809e-11
},
"unit": "kgSbeq"
},
"pe": {
"type": "PE",
"name": "Primary Energy",
"value": {
"min": 0.0000026205170281582953,
"max": 0.0000026205170281582953
},
"unit": "MJ"
}
},
"warnings": [
{
"code": "model-arch-not-released",
"message": "The model architecture has not been released, expect lower precision."
},
{
"code": "model-arch-multimodal",
"message": "The model architecture is multimodal, expect lower precision."
}
]
}
}

model examples;
[
"c4ai-aya-expanse-8b",
"c4ai-aya-expanse-32b",
"c4ai-aya-vision-8b",
"c4ai-aya-vision-32b",
"command-a-03-2025",
"command-a-reasoning-08-2025",
"command-a-translate-08-2025",
"command-a-vision-07-2025",
"command-r",
"command-r-08-2024",
"command-r-plus-08-2024",
"command-r7b-12-2024",
"command-r7b-arabic-02-2025",
"databricks/dolly-v1-6b",
"databricks/dolly-v2-12b",
"databricks/dolly-v2-7b",
"databricks/dolly-v2-3b",
"databricks/dbrx-base",
"databricks/dbrx-instruct",
"mistralai/Mistral-7B-v0.1",
"mistralai/Mistral-7B-Instruct-v0.1",
"mistralai/Mixtral-8x7B-v0.1",
"mistralai/Mixtral-8x7B-Instruct-v0.1",
"mistralai/Mistral-7B-Instruct-v0.2",
"mistralai/Mixtral-8x22B-v0.1",
"mistralai/Mixtral-8x22B-Instruct-v0.1",
"mistralai/Mistral-7B-v0.3",
"mistralai/Mistral-7B-Instruct-v0.3",
"mistralai/Codestral-22B-v0.1",
"mistralai/Mathstral-7B-v0.1",
"mistralai/Mistral-Nemo-Instruct-2407",
"mistralai/Mistral-Nemo-Base-2407",
"mistralai/Mistral-Large-Instruct-2407",
"mistral-community/Mistral-7B-v0.2",
"mistral-community/Mixtral-8x22B-v0.1",
"mistral-community/Mixtral-8x22B-v0.1-original",
"mistral-community/Mixtral-8x22B-v0.1-4bit",
"mistral-community/Mixtral-8x22B-v0.1-AWQ",
"mistral-community/Mixtral-8x22B-Instruct-v0.1-4bit",
"mistral-community/mixtral-8x22B-Instruct-v0.3-original",
"mistral-community/mixtral-8x22B-v0.3-original",
"mistral-community/mixtral-8x22B-v0.3",
"mistral-community/Mistral-7B-Instruct-v0.3",
"mistral-community/Codestral-22B-v0.1",
"meta-llama/Meta-Llama-3.1-8B",
"meta-llama/Meta-Llama-3.1-8B-Instruct",
"meta-llama/Meta-Llama-3.1-70B",
"meta-llama/Meta-Llama-3.1-70B-Instruct",
"meta-llama/Meta-Llama-3.1-405B",
"meta-llama/Meta-Llama-3.1-405B-Instruct",
"meta-llama/Meta-Llama-3.1-405B-FP8",
"meta-llama/Meta-Llama-3.1-Instruct",
"meta-llama/Meta-Llama-3-8B",
"meta-llama/Meta-Llama-3-8B-Instruct",
"meta-llama/Meta-Llama-3-70B",
"meta-llama/Meta-Llama-3-70B-Instruct",
"meta-llama/Meta-Llama-2-7b-hf",
"meta-llama/Meta-Llama-2-13b-hf",
"meta-llama/Meta-Llama-2-70b-hf",
"meta-llama/Meta-Llama-2-7b-chat-hf",
"meta-llama/Meta-Llama-2-13b-chat-hf",
"meta-llama/Meta-Llama-2-70b-chat-hf",
"tiiuae/Falcon-7b",
"tiiuae/Falcon-7b-instruct",
"tiiuae/Falcon-40b",
"tiiuae/Falcon-40b-instruct",
"tiiuae/falcon-180B",
"tiiuae/falcon-180B-chat",
"tiiuae/Falcon-11B",
"tiiuae/Falcon-11B-instruct",
"google/flan-t5-base",
"google/flan-t5-large",
"google/flan-t5-xl",
"google/flan-t5-xxl",
"google/flan-ul2",
"google/Gemma-2-9b",
"google/Gemma-2-9b-it",
"google/Gemma-2-27b",
"google/Gemma-2-27b-it",
"google/codegemma-7b",
"google/codegemma-7b-it",
"google/gemma-7b",
"google/gemma-7b-it",
"google/gemma-2b",
"google/gemma-2b-it",
"bigcode/starcoder",
"bigcode/starcoder2-3b",
"bigcode/starcoder2-7b",
"bigcode/starcoder2-15b",
"bigcode/starcoderplus",
"NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO",
"openchat/openchat-3.5-0106",
"openchat/openchat-3.6-8b-20240522",
"openchat/openchat-3.6-8b",
"Qwen/Qwen1.5-0.5B",
"Qwen/Qwen1.5-1.8B",
"Qwen/Qwen1.5-4B",
"Qwen/Qwen1.5-7B",
"Qwen/Qwen1.5-14B",
"Qwen/Qwen1.5-32B",
"Qwen/Qwen1.5-72B",
"Qwen/Qwen1.5-0.5B-Chat",
"Qwen/Qwen1.5-1.8B-Chat",
"Qwen/Qwen1.5-4B-Chat",
"Qwen/Qwen1.5-7B-Chat",
"Qwen/Qwen1.5-14B-Chat",
"Qwen/Qwen1.5-32B-Chat",
"Qwen/Qwen1.5-72B-Chat",
"Qwen/Qwen2-0.5B",
"Qwen/Qwen2-1.5B",
"Qwen/Qwen2-7B",
"Qwen/Qwen2-57B-A14B",
"Qwen/Qwen2-72B",
"Qwen/Qwen2-0.5B-Instruct",
"Qwen/Qwen2-1.5B-Instruct",
"Qwen/Qwen2-7B-Instruct",
"Qwen/Qwen2-57B-A14B-Instruct",
"Qwen/Qwen2-72B-Instruct",
"upstage/SOLAR-10.7B-v1.0",
"upstage/SOLAR-10.7B-Instruct-v1.0",
"upstage/Llama-2-70b-chat-with-rslora",
"upstage/llama-65b-instruct-2m",
"upstage/llama-30b-instruct-2m",
"upstage/llama-13b-instruct-2m",
"defog/sqlcoder",
"defog/sqlcoder-7b",
"TheBloke/Mistral-7B-Instruct-v0.1-GPTQ",
"TheBloke/Mistral-7B-Instruct-v0.2-GPTQ",
"teknium/OpenHermes-2.5-Mistral-7B",
"teknium/OpenHermes-2-Mistral-7B",
"gpt2",
"gpt2-medium",
"gpt2-large",
"gpt2-xl",
"distilbert/distilgpt2",
"EleutherAI/gpt-neo-125M",
"EleutherAI/gpt-neo-1.3B",
"EleutherAI/gpt-neo-2.7B",
"EleutherAI/gpt-j-6B",
"EleutherAI/pythia-70m",
"EleutherAI/pythia-160m",
"EleutherAI/pythia-410m",
"EleutherAI/pythia-1b",
"EleutherAI/pythia-1.4b",
"EleutherAI/pythia-2.8b",
"EleutherAI/pythia-6.9b",
"EleutherAI/pythia-12b",
"togethercomputer/RedPajama-INCITE-7B-Base",
"togethercomputer/RedPajama-INCITE-7B-Instruct",
"togethercomputer/RedPajama-INCITE-Base-3B-v1",
"togethercomputer/RedPajama-INCITE-Instruct-3B-v1",
"gpt-3.5-turbo",
"gpt-3.5-turbo-0125",
"gpt-3.5-turbo-1106",
"gpt-4-turbo",
"gpt-4-turbo-2024-04-09",
"gpt-4-turbo-preview",
"gpt-4-1106-preview",
"gpt-4",
"gpt-4-32k",
"gpt-4-vision-preview",
"gpt-4-turbo-with-vision",
"gpt-4o",
"gpt-4o-2024-05-13",
"claude-opus-4-1",
"claude-opus-4-1-20250805",
"claude-opus-4-0",
"claude-opus-4-20250514",
"claude-sonnet-4-0",
"claude-sonnet-4-20250514",
"claude-haiku-4-5",
"claude-haiku-4-5-20251001",
"claude-sonnet-4-5",
"claude-sonnet-4-5-20250929",
"claude-opus-4-5",
"claude-opus-4-5-20251101",
"claude-3-opus-20240229",
"claude-3-sonnet-20240229",
"claude-3-haiku-20240307",
"claude-instant-1.2",
"claude-instant-1.1",
"claude-instant-1",
"claude-2.1",
"claude-2",
"claude-1.3",
"claude-1.2",
"claude-1",
"palm-2",
"text-bison",
"text-unicorn",
"gemini-pro",
"gemini-1.5-pro",
"gemini-1.5-flash",
"gemini-2.0-flash",
"text-davinci-003",
"text-davinci-002",
"code-davinci-002",
"text-curie-001",
"text-babbage-001",
"text-ada-001"
]
