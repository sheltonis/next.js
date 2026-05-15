const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

app.post('/analyze', async (req, res) => {
  try {
    const { game, videoBase64 } = req.body;

    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({
        error: 'Server error: API key not configured'
      });
    }

    if (!videoBase64) {
      return res.status(400).json({
        error: 'No video data provided'
      });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a professional esports aim coach. Analyze this ${game} gameplay clip and provide concise, actionable feedback. Focus on:\n\n1. AIM ACCURACY - Specific moments of over/under aiming\n2. SENSITIVITY - Is it too high or too low based on flick patterns?\n3. CROSSHAIR PLACEMENT - Pre-aiming and positioning\n4. MOVEMENT - Peeking, positioning, angles\n5. TOP 3 IMPROVEMENTS - Concrete tips to level up\n\nBe direct and specific. Use exact examples from the video.`
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'video/webm',
                data: videoBase64
              }
            }
          ]
        }
      ]
    });

    const feedback = message.content[0].type === 'text' ? message.content[0].text : '';

    res.json({
      success: true,
      feedback: feedback
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to analyze video'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
