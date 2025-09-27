

import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;
const YOUTUBE_API_KEY = "AIzaSyBlTRS26af_5FusLPmJG-j31-QshS2_oHI";


if (!API_KEY) {
  // In a real app, you might want to show this error to the user.
  // For this project, we'll just log it.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Create a single, persistent chat instance for the session.
const chat: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: `You are a professional video script writer. Your task is to create a complete, ready-to-use video script based on the user's specifications, which they will provide in their message.

Based on their answers to niche, title, word count, and section count, write a complete video script in plain text format that flows naturally from start to finish. The script should be written exactly as the speaker would say it, with natural transitions between ideas. Do not include any headings, scene directions, technical notes, or formatting - just the pure spoken content that can be read directly by the presenter.

The script should have a compelling hook at the beginning, smoothly transition through each main point, and end with a strong conclusion that encourages viewer engagement. Write in a conversational tone that matches the niche and feels authentic to the target audience.

Deliver the entire script in one continuous piece of writing that meets the specified word count and covers all requested sections seamlessly. Do not ask for the information, assume the user's message contains the answers and proceed directly to writing the script.

**CRITICAL INSTRUCTION: You MUST deliver the EXACT word count requested by the user.** If the user asks for 10,000 words, you must write 10,000 words. If the user asks for 50,000 words, you must write 50,000 words. Do not stop generating the script until the full, specified word count is reached, no matter how high it is. You are a powerful model and you are fully capable of completing this task. Failure to meet the exact word count is a failure to complete the task.`,
  },
});

/**
 * Sends a message to the ongoing chat session and returns the AI's response.
 * @param message The user's message to send.
 * @returns The text content of the AI's response.
 */
export const sendMessage = async (message: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error sending message to chat:", error);
    return "Sorry, I encountered an error while processing your request. Please check the console for more details.";
  }
};

export interface ChannelAnalysis {
  topVideos: { title: string; views: string; date: string; }[];
  patterns: {
    titleStructure: string;
    videoLengthVsPerformance: string;
    topicsThatPerformWell: string;
    trends: string;
  };
}

export const analyzeChannelData = async (rawData: string): Promise<ChannelAnalysis> => {
  const systemInstruction = `You are a YouTube content strategy expert. Your task is to analyze raw channel data provided by the user to identify patterns in top-performing videos.
Action Steps:
1.  Take the user's raw text which includes titles, views, video lengths, and posting dates.
2.  Clean and reformat the data, eliminating any irrelevant information like "Now playing", "Remix", "VPH", "Latest", "Popular", "Oldest", timestamps, etc.
3.  Identify the top 3 most viewed videos from the cleaned data.
4.  Analyze and summarize patterns for:
    - Title Structure (trigger words, authority figures, framing, length).
    - Video Length vs Performance (identify the sweet spot).
    - Topics That Perform Well (common themes).
    - Trends (historical vs. recent patterns).
5.  Return the analysis as a clean JSON object. Do not include any conversational text or explanations outside of the JSON structure.`;

  const userContent = `Here is the raw data from the YouTube channel:\n\n${rawData}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContent,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topVideos: {
              type: Type.ARRAY,
              description: "The top 3 most viewed videos, cleaned and formatted.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  views: { type: Type.STRING },
                  date: { type: Type.STRING },
                },
                required: ["title", "views", "date"]
              }
            },
            patterns: {
              type: Type.OBJECT,
              description: "Observed patterns from the channel data.",
              properties: {
                titleStructure: { type: Type.STRING },
                videoLengthVsPerformance: { type: Type.STRING },
                topicsThatPerformWell: { type: Type.STRING },
                trends: { type: Type.STRING },
              },
              required: ["titleStructure", "videoLengthVsPerformance", "topicsThatPerformWell", "trends"]
            }
          },
          required: ["topVideos", "patterns"]
        },
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ChannelAnalysis;
  } catch (error) {
    console.error("Error analyzing channel data:", error);
    throw new Error("Failed to analyze channel data. The model may have returned an invalid response. Please check your input format.");
  }
};

export interface CompetitorData {
  transcript: string;
  comments: string;
}

export const analyzeCompetitorData = async (competitorData: CompetitorData[]): Promise<string> => {
    let userContent = "Analyze these competitor video transcripts and comments to find patterns for creating viral script ideas. Focus on what the audience is asking for, what parts they love, and the structure of the content. Provide a detailed summary of your findings.\n\n";
    competitorData.forEach((data, index) => {
        if (data.transcript.trim() || data.comments.trim()) {
            userContent += `--- COMPETITOR ${index + 1} ---\n`;
            userContent += `TRANSCRIPT:\n${data.transcript || 'No transcript provided.'}\n\n`;
            userContent += `COMMENTS:\n${data.comments || 'No comments provided.'}\n\n`;
        }
    });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userContent,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing competitor data:", error);
        throw new Error("Failed to analyze competitor data. The model may have returned an invalid response.");
    }
};


export const analyzeCompetitorsForTitleIdeas = async (competitorData: CompetitorData[]): Promise<ChannelAnalysis> => {
  const systemInstruction = `You are a YouTube viral title expert. Your task is to analyze competitor video transcripts and comments to find patterns for creating new, high-performing titles.
Action Steps:
1.  Review the provided transcripts to understand the core topics, structure, and language used.
2.  Review the comments to identify audience sentiment, recurring questions, and phrases that indicate high engagement.
3.  Based on your analysis, synthesize the key patterns.
4.  Identify 3 "virtual" top videos. These aren't real videos, but representative concepts of what seems to perform best based on the data. Give them a title, a summary of why they work as "views", and a "date" representing recency of the topic.
5.  Summarize the patterns for:
    - Title Structure (e.g., use of keywords, questions, emotional triggers, formatting like ALL CAPS).
    - Video Length vs Performance (Infer from transcript length and comment sentiment if possible).
    - Topics That Perform Well (Common themes across the provided data).
    - Trends (What is the audience currently excited about or asking for?).
6.  Return the analysis as a clean JSON object. Do not include any conversational text. Your entire response must be only the JSON object.`;

  let userContent = "Here is the raw data from competitor YouTube videos:\n\n";
  competitorData.forEach((data, index) => {
    if (data.transcript.trim() || data.comments.trim()) {
      userContent += `--- COMPETITOR ${index + 1} ---\n`;
      userContent += `TRANSCRIPT:\n${data.transcript || 'No transcript provided.'}\n\n`;
      userContent += `COMMENTS:\n${data.comments || 'No comments provided.'}\n\n`;
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContent,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topVideos: {
              type: Type.ARRAY,
              description: "Representative concepts of top-performing videos based on the analysis.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  views: { type: Type.STRING, description: "A qualitative summary of why this concept is popular." },
                  date: { type: Type.STRING, description: "A qualitative assessment of the topic's recency (e.g., 'Trending Now')." },
                },
                required: ["title", "views", "date"]
              }
            },
            patterns: {
              type: Type.OBJECT,
              description: "Observed patterns from the competitor data.",
              properties: {
                titleStructure: { type: Type.STRING },
                videoLengthVsPerformance: { type: Type.STRING },
                topicsThatPerformWell: { type: Type.STRING },
                trends: { type: Type.STRING },
              },
              required: ["titleStructure", "videoLengthVsPerformance", "topicsThatPerformWell", "trends"]
            }
          },
          required: ["topVideos", "patterns"]
        },
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ChannelAnalysis;
  } catch (error) {
    console.error("Error analyzing competitor data for titles:", error);
    throw new Error("Failed to analyze competitor data for titles. The model may have returned an invalid response.");
  }
};


export interface GeneratedTitle {
  title: string;
  score: number;
}

export const generateTitlesFromAnalysis = async (analysis: ChannelAnalysis, count: number): Promise<GeneratedTitle[]> => {
    const systemInstruction = `You are a YouTube viral title generator. Based on a detailed analysis of a successful channel, your task is to generate ${count} new, concrete title ideas that mirror the structure, topics, and patterns of the best-performing videos.
You will be given the analysis containing patterns for title structure, topics, and trends.
Action Steps:
1.  Strictly adhere to the provided analysis.
2.  Generate ${count} new titles that are highly similar in structure, wording, and theme.
3.  For each title, assign a score from 1-10 based on its similarity to viral hits, consistency with channel themes, and recency relevance.
4.  Return the result as a clean JSON object containing a list of titles with their scores.`;
    
    const userContent = `Based on the following analysis, generate ${count} titles:\n\nANALYSIS:\n${JSON.stringify(analysis, null, 2)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userContent,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        titles: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    score: { type: Type.NUMBER },
                                },
                                required: ["title", "score"]
                            }
                        }
                    },
                    required: ["titles"]
                }
            }
        });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.titles as GeneratedTitle[];
    } catch (error) {
        console.error("Error generating titles:", error);
        throw new Error("Failed to generate titles. The model may have returned an invalid response.");
    }
};

export const selectClickbaitTitles = async (titles: string[], count: number): Promise<string[]> => {
    const systemInstruction = `You are an expert in human psychology and viral content. Your task is to analyze a list of YouTube titles and select the ${count} titles that are most likely to be clicked on. Be bold and open in your choices. Select the specific titles that would catch your attention and make you click.`;
    
    const userContent = `From the following list of titles, select the ${count} most psychologically compelling and clickable ones:\n\n${titles.join('\n')}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userContent,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        clickbaitTitles: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["clickbaitTitles"]
                }
            }
        });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.clickbaitTitles as string[];
    } catch (error) {
        console.error("Error selecting clickbait titles:", error);
        throw new Error("Failed to select clickbait titles from the list.");
    }
};

/**
 * Transforms a simple user prompt into a detailed, high-CTR prompt for image generation.
 * @param userPrompt The user's basic prompt.
 * @param overlayText Optional text to include on the thumbnail.
 * @returns The enhanced, detailed prompt.
 */
export const enhancePrompt = async (userPrompt: string, overlayText?: string): Promise<string> => {
  const systemInstruction = `You are an expert prompt engineer for AI image generators. Your task is to take a user's simple idea and expand it into a detailed, vivid, single-sentence prompt suitable for generating a high-quality, viral YouTube thumbnail. The style should be eye-catching and dynamic. If the user provides optional overlay text, you must incorporate instructions for rendering that text into the prompt. The text description should be stylistic (e.g., 'bold, glowing yellow text', 'modern sans-serif font') and placed appropriately for maximum impact.`;
  const userContent = `User Idea: "${userPrompt}"\n${overlayText ? `Optional Overlay Text: "${overlayText}"` : ''}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContent,
      config: { systemInstruction },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    // Fallback to the original prompt if enhancement fails
    return userPrompt;
  }
};

export interface ImageAnalysis {
  analysis: {
    mainSubjects: string;
    styleAndMedium: string;
    colorPaletteAndMood: string;
    textElements: string;
    background: string;
    compositionAndLayout: string;
    specialEffects: string;
  };
  finalPrompt: string;
}

export const analyzeImageAndCreatePrompt = async (base64ImageData: string, mimeType: string): Promise<ImageAnalysis> => {
  const imagePart = {
    inlineData: { data: base64ImageData, mimeType }
  };
  const textPart = {
    text: `You are a world-class thumbnail analyst. Your task is to meticulously analyze the provided image and generate a JSON object containing a detailed breakdown and a concise, single-sentence, recreation-ready prompt for an AI image generator. The JSON output must strictly adhere to the provided schema.`
  };

  const schema = {
    type: Type.OBJECT,
    properties: {
      analysis: {
        type: Type.OBJECT,
        properties: {
          mainSubjects: { type: Type.STRING, description: "Who/what is the focus, their pose, angle, size." },
          styleAndMedium: { type: Type.STRING, description: "Cartoon, 3D, photorealistic, cinematic, sketch, flat vector, etc." },
          colorPaletteAndMood: { type: Type.STRING, description: "Dominant colors, overall emotional tone." },
          textElements: { type: Type.STRING, description: "Font style, text placement, text colors, outline effects. State 'None' if no text is present." },
          background: { type: Type.STRING, description: "Solid color, gradient, realistic scene, abstract shapes, blurred, etc." },
          compositionAndLayout: { type: Type.STRING, description: "Subject placement, framing, layering (foreground/background)." },
          specialEffects: { type: Type.STRING, description: "Glow, highlights, shadows, arrows, motion blur, overlays." },
        },
      },
      finalPrompt: {
        type: Type.STRING,
        description: "A single, recreation-ready sentence prompt. Example: '[Style] thumbnail showing [main subject] with [pose/angle], [color palette/mood], [background details], [composition], [special effects]. Text in [font style, placement, and color].' Omit the text part if none is present.",
      },
    },
    required: ["analysis", "finalPrompt"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ImageAnalysis;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image. The model may have returned an invalid response.");
  }
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    return null;

  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

export interface LogoGenerationParams {
  channelName: string;
  channelNiche: string;
  logoStyle: string;
  primaryColors: string[];
  additionalKeywords: string;
}

export const generateLogo = async (params: LogoGenerationParams): Promise<string | null> => {
  const { channelName, channelNiche, logoStyle, primaryColors, additionalKeywords } = params;

  const prompt = `A professional, high-resolution logo for a YouTube channel named "${channelName}". The logo's primary subject is ${channelNiche}, incorporating ${additionalKeywords || 'a relevant symbol'}. The art style is ${logoStyle}. The color palette is ${primaryColors.join(', ')} and complementary colors. The logo should be a simple, vector-style icon with a clean, transparent background. The design must be scalable and instantly recognizable, suitable for a profile picture. The composition should be centered and balanced. No extraneous text, borders, or watermarks.`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    return null;

  } catch (error) {
    console.error("Error generating logo:", error);
    return null;
  }
};

export interface YoutubeBannerParams {
  channelName: string;
  channelNiche: string;
  channelTheme: string;
  aesthetic: string;
  mood: string;
  primaryVisualElements: string;
  secondaryVisualElements: string;
  compositionStyle: string;
  fontStyle: string;
  tagline: string;
  dominantColors: string;
  accentColors: string;
  artStyle: string;
  specificDetails: string;
  cta: string;
}

export const generateYoutubeBanner = async (params: YoutubeBannerParams): Promise<string | null> => {
  const { 
    channelName, channelNiche, channelTheme, aesthetic, mood,
    primaryVisualElements, secondaryVisualElements, compositionStyle,
    fontStyle, tagline, dominantColors, accentColors, artStyle,
    specificDetails, cta
  } = params;

  const prompt = `A professional, high-quality YouTube banner (2560x1440 pixels) for a **${channelNiche}** channel named "**${channelName}**". The core theme is **${channelTheme}**. The primary subject is **${primaryVisualElements}**. The overall aesthetic is **${aesthetic}** with a **${mood}** mood, rendered in a **${artStyle}** style.

Composition: The composition is **${compositionStyle}**. All critical elements, especially the text and primary visuals, must be placed within the central "safe zone" (approximately the middle 1546x423 pixels) to ensure visibility on all devices from mobile to TV. The background features **${secondaryVisualElements}**.

Typography: The channel name "**${channelName}**" is prominently displayed in a **${fontStyle}**. The tagline "**${tagline}**" is included in a smaller, complementary font. Text must be masterfully integrated into the design for a professional look, not just overlaid. ${cta ? `Include the call-to-action text "${cta}" subtly within the design.` : ''}

Color & Lighting: The dominant colors are **${dominantColors}**, accented with **${accentColors}**. The lighting should be cinematic and enhance the mood.

Details & Quality: The image should be hyper-detailed, with **${specificDetails}**. Avoid cluttered layouts and ensure high contrast for text readability. The final image must look professional, polished, and captivating. No watermarks or signatures.`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '16:9',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    return null;

  } catch (error) {
    console.error("Error generating YouTube banner:", error);
    return null;
  }
};

export const analyzeAndFillBannerForm = async (channelDescription: string): Promise<YoutubeBannerParams> => {
  const aestheticOptions = ["Minimalist", "Vibrant & Energetic", "Dark & Moody", "Retro / Vintage", "Futuristic / Sci-Fi", "Corporate & Clean", "Grunge / Textured", "Abstract"];
  const moodOptions = ["Inspiring & Motivational", "Mysterious & Intriguing", "Playful & Fun", "Professional & Authoritative", "Calm & Relaxing", "Epic & Cinematic", "Humorous & Lighthearted"];
  const compositionOptions = ["Centered Focus", "Rule of Thirds", "Symmetrical Balance", "Asymmetrical Layout", "Dynamic & Diagonal Lines", "Minimalist with Negative Space"];
  const fontOptions = ["Modern Sans-Serif (e.g., Helvetica)", "Bold Display (Impactful)", "Elegant Serif (e.g., Times New Roman)", "Script & Handwritten", "Futuristic & Tech", "Retro & Vintage", "Graffiti Style"];
  const artStyleOptions = ["Hyperrealistic Photography", "Digital Painting", "3D Render", "Anime / Manga Style", "Clean Vector Art", "Cartoon & Illustrated", "Watercolor"];

  const systemInstruction = `You are an expert YouTube branding strategist and creative director. Your task is to analyze a user's channel description and populate a detailed form to generate the perfect YouTube banner prompt. You must fill every field of the JSON schema. For fields with options, you MUST select the most fitting option from the provided list. Be creative and infer details where necessary to create a cohesive and compelling brand identity.

  Here are the available options for the choice-based fields:
  - aesthetics: ${aestheticOptions.join(', ')}
  - moods: ${moodOptions.join(', ')}
  - compositionStyles: ${compositionOptions.join(', ')}
  - fontStyles: ${fontOptions.join(', ')}
  - artStyles: ${artStyleOptions.join(', ')}
  `;

  const schema = {
      type: Type.OBJECT,
      properties: {
          channelName: { type: Type.STRING, description: "Extract or infer the channel name. If not present, create a plausible one." },
          channelNiche: { type: Type.STRING, description: "The primary topic or category of the channel (e.g., 'Sci-Fi Book Reviews')." },
          channelTheme: { type: Type.STRING, description: "The core conceptual theme (e.g., 'Exploring the cosmos')." },
          aesthetic: { type: Type.STRING, description: `Select one aesthetic from this list: ${aestheticOptions.join(', ')}` },
          mood: { type: Type.STRING, description: `Select one mood from this list: ${moodOptions.join(', ')}` },
          primaryVisualElements: { type: Type.STRING, description: "Describe the main subjects or imagery (e.g., 'A portrait of an astronaut')." },
          secondaryVisualElements: { type: Type.STRING, description: "Describe the background elements (e.g., 'A swirling nebula and distant planets')." },
          compositionStyle: { type: Type.STRING, description: `Select one composition style from this list: ${compositionOptions.join(', ')}` },
          fontStyle: { type: Type.STRING, description: `Select one font style from this list: ${fontOptions.join(', ')}` },
          tagline: { type: Type.STRING, description: "Create a short, catchy tagline. If none is provided, invent one." },
          cta: { type: Type.STRING, description: "Create a short call-to-action like 'Subscribe!'. Can be an empty string." },
          dominantColors: { type: Type.STRING, description: "Suggest 2-3 dominant colors (e.g., 'deep navy blue, black')." },
          accentColors: { type: Type.STRING, description: "Suggest 1-2 accent colors that complement the dominant ones (e.g., 'electric pink, gold')." },
          artStyle: { type: Type.STRING, description: `Select one art style from this list: ${artStyleOptions.join(', ')}` },
          specificDetails: { type: Type.STRING, description: "Add any final creative details or negative prompts (e.g., 'subtle lens flare, hyper-detailed')." },
      },
      required: ['channelName', 'channelNiche', 'channelTheme', 'aesthetic', 'mood', 'primaryVisualElements', 'secondaryVisualElements', 'compositionStyle', 'fontStyle', 'tagline', 'cta', 'dominantColors', 'accentColors', 'artStyle', 'specificDetails']
  };

  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Analyze the following channel description and fill out the form:\n\n"${channelDescription}"`,
          config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: schema,
          }
      });

      const jsonText = response.text.trim();
      return JSON.parse(jsonText) as YoutubeBannerParams;
  } catch (error) {
      console.error("Error analyzing channel for banner form:", error);
      throw new Error("Failed to analyze channel description. The model may have returned an invalid response.");
  }
};

export interface YoutubeNameParams {
  style: string;
  randomness: string;
  keywords: string;
  pitch: string;
}

export interface YoutubeNameResult {
  id: string;
  name: string;
  handle: string;
}

export const generateYoutubeNames = async (params: YoutubeNameParams): Promise<YoutubeNameResult[]> => {
  const { style, randomness, keywords, pitch } = params;

  const prompt = `You are a YouTube-naming expert. Your task is to generate 50 channel name ideas based on user inputs.

**Available Name Styles & Examples:**
- **Auto / All Styles**: Generate a mix of names from all available styles.
- **Brandable**: Unique, memorable names that sound like a brand (e.g., Google, Rolex).
- **Evocative**: Names that suggest a feeling or idea (e.g., RedBull, Forever21).
- **Short Phrase**: Names composed of a few words (e.g., Dollar Shave Club).
- **Compound Words**: A name made by joining two words (e.g., FedEx, Microsoft).
- **Alternate Spelling**: A name that uses a creative or phonetic spelling (e.g., Lyft, Fiverr).
- **Non-English Words**: Names using words from other languages (e.g., Toyota, Audi).
- **Real Words**: Names using common, everyday words (e.g., Apple, Amazon).

**User Inputs:**
- **Selected Style**: ${style}
- **Randomness Level**: ${randomness}
- **Keywords**: ${keywords}
- **Pitch**: ${pitch || 'Not provided.'}

**Instructions:**
1.  Analyze the user's keywords and pitch to understand the channel's core identity.
2.  Generate 50 diverse and creative channel name ideas.
3.  For each name, create a corresponding YouTube handle (e.g., "@Name"). The handle should be simple, without numbers or special characters if possible.
4.  Strictly adhere to the selected name style. If "Auto," provide a mix of all styles.
5.  Adjust the creativity based on the randomness level:
    - **Low**: Names directly related to the keywords.
    - **Medium**: Mixes keywords with related concepts and wordplay.
    - **High**: Abstract twists, metaphors, and highly creative interpretations.
6.  Return the output as a clean JSON object. Do not include any text outside the JSON structure.
`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
        names: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    handle: { type: Type.STRING },
                },
                required: ["id", "name", "handle"]
            }
        }
    },
    required: ["names"]
  };

  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: schema,
          }
      });

      const jsonText = response.text.trim();
      const parsed = JSON.parse(jsonText);
      return parsed.names as YoutubeNameResult[];
  } catch (error) {
      console.error("Error generating YouTube names:", error);
      throw new Error("Failed to generate YouTube names. The model returned an invalid response.");
  }
};

export interface OutlineSection {
  title: string;
  summary: string;
}

export const generateScriptOutline = async (systemPrompt: string, videoTitle: string): Promise<OutlineSection[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Video Title: "${videoTitle}"`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        outline: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    summary: { type: Type.STRING }
                                },
                                required: ["title", "summary"]
                            }
                        }
                    },
                    required: ["outline"]
                }
            }
        });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.outline as OutlineSection[];
    } catch (error) {
        console.error("Error generating script outline:", error);
        throw new Error("Failed to generate script outline. The model may have returned an invalid or incomplete response. Check your prompt and try again.");
    }
};

export const expandScriptSection = async (systemPrompt: string, section: OutlineSection): Promise<string> => {
    const userContent = `Expand the following section:\n\nTitle: ${section.title}\nSummary: ${section.summary}`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userContent,
            config: {
                systemInstruction: systemPrompt
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error expanding section "${section.title}":`, error);
        throw new Error(`Failed to expand section "${section.title}".`);
    }
};

export interface YoutubeSeoMetadata {
    catchyTitle: string;
    description: string;
    hashtags: string[];
    videoTags: string;
}

export const generateYoutubeSeoMetadata = async (videoTitle: string): Promise<YoutubeSeoMetadata> => {
    const systemInstruction = `You are a YouTube SEO expert. Your task is to generate a complete metadata package for a video based on its title. The output must be a clean JSON object.`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            catchyTitle: { type: Type.STRING, description: "A slightly more engaging, click-friendly version of the user's title." },
            description: { type: Type.STRING, description: "A 3-5 paragraph, SEO-optimized description. It must include a hook, a summary of the video's content, relevant keywords, and a call-to-action." },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 5-7 relevant hashtags, including at least one broad and several niche tags." },
            videoTags: { type: Type.STRING, description: "A comma-separated string of 15-20 relevant keywords and long-tail keywords for the YouTube tags section." }
        },
        required: ["catchyTitle", "description", "hashtags", "videoTags"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate SEO metadata for the video titled: "${videoTitle}"`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as YoutubeSeoMetadata;
    } catch (error) {
        console.error("Error generating YouTube SEO metadata:", error);
        throw new Error("Failed to generate SEO metadata. The model returned an invalid response.");
    }
};

export interface ViralVideo {
    videoId: string;
    title: string;
    channelName: string;
    subscribers: number;
    views: number;
    duration: number; // in seconds
    publishedDate: string;
    keywords: string[];
    description: string;
    thumbnailUrl: string;
}

export interface ViralVideoSearchParams {
    category: string;
    keywords: string;
    days: number;
    minSubs: number;
    maxSubs: number;
    minViews: number;
    maxViews: number;
    minDuration: number;
    maxDuration: number;
}

const YOUTUBE_CATEGORY_IDS: { [key: string]: string } = {
    "Film & Animation": "1",
    "Autos & Vehicles": "2",
    "Music": "10",
    "Pets & Animals": "15",
    "Sports": "17",
    "Travel & Events": "19",
    "Gaming": "20",
    "People & Blogs": "22",
    "Comedy": "23",
    "Entertainment": "24",
    "News & Politics": "25",
    "Howto & Style": "26",
    "Education": "27",
    "Science & Technology": "28",
};

const parseISO8601Duration = (duration: string): number => {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
};

export const findViralVideos = async (params: ViralVideoSearchParams): Promise<ViralVideo[]> => {
    const BASE_URL = 'https://www.googleapis.com/youtube/v3';

    const publishedAfter = new Date();
    publishedAfter.setDate(publishedAfter.getDate() - params.days);

    const categoryId = YOUTUBE_CATEGORY_IDS[params.category];
    let q = params.keywords.trim();
    if (!categoryId && params.category !== 'All Categories') {
        q = `${params.category} ${params.keywords}`.trim();
    }
    
    if (!q) {
        q = params.category !== 'All Categories' ? params.category : 'trending';
    }

    const searchParams = new URLSearchParams({
        part: 'snippet',
        q: q,
        type: 'video',
        maxResults: '50',
        order: 'viewCount',
        publishedAfter: publishedAfter.toISOString(),
        key: YOUTUBE_API_KEY,
    });
    if (categoryId) {
        searchParams.append('videoCategoryId', categoryId);
    }
    
    const searchResponse = await fetch(`${BASE_URL}/search?${searchParams.toString()}`);
    if (!searchResponse.ok) throw new Error(`YouTube API Error: ${searchResponse.statusText}`);
    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');
    
    if (!videoIds) return [];

    const videosParams = new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        id: videoIds,
        key: YOUTUBE_API_KEY,
    });

    const videosResponse = await fetch(`${BASE_URL}/videos?${videosParams.toString()}`);
    if (!videosResponse.ok) throw new Error('Failed to fetch video details.');
    const videosData = await videosResponse.json();

    const videosWithDetails = videosData.items?.map((item: any) => ({
        ...item,
        durationSeconds: parseISO8601Duration(item.contentDetails.duration),
        viewCount: parseInt(item.statistics.viewCount, 10),
    })) || [];

    const filteredByMeta = videosWithDetails.filter((video: any) => 
        video.viewCount >= params.minViews &&
        video.viewCount <= params.maxViews &&
        video.durationSeconds >= params.minDuration &&
        video.durationSeconds <= params.maxDuration
    );

    if (filteredByMeta.length === 0) return [];

    const channelIds = [...new Set(filteredByMeta.map((video: any) => video.snippet.channelId))].join(',');
    const channelsParams = new URLSearchParams({
        part: 'statistics',
        id: channelIds,
        key: YOUTUBE_API_KEY,
    });

    const channelsResponse = await fetch(`${BASE_URL}/channels?${channelsParams.toString()}`);
    if (!channelsResponse.ok) throw new Error('Failed to fetch channel details.');
    const channelsData = await channelsResponse.json();
    
    const subsMap = new Map<string, number>();
    channelsData.items?.forEach((channel: any) => {
        subsMap.set(channel.id, parseInt(channel.statistics.subscriberCount, 10));
    });

    const finalResults: ViralVideo[] = [];
    for (const video of filteredByMeta) {
        const subscribers = subsMap.get(video.snippet.channelId) || 0;
        if (subscribers >= params.minSubs && subscribers <= params.maxSubs) {
            finalResults.push({
                videoId: video.id,
                title: video.snippet.title,
                channelName: video.snippet.channelTitle,
                subscribers,
                views: video.viewCount,
                duration: video.durationSeconds,
                publishedDate: new Date(video.snippet.publishedAt).toLocaleDateString(),
                keywords: video.snippet.tags || [],
                description: video.snippet.description,
                thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
            });
        }
    }

    return finalResults;
};

// --- FIX: Add missing functions and types for YoutubeNicheResearch component ---
export interface KeywordInsights {
  overallScore: number;
  scoreAnalysis: {
    searchVolume: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    competition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    optimizationStrength: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  };
  interestOverTime: { name: string; interest: number }[];
  relatedSearches: { keyword: string; score: number }[];
}

export const getKeywordInsights = async (keyword: string): Promise<KeywordInsights> => {
  const systemInstruction = `You are a YouTube SEO and keyword analysis expert. Your task is to analyze a given keyword and provide a detailed breakdown in a clean JSON format.

Action Steps:
1.  Analyze the provided keyword for its potential on YouTube.
2.  Assign an overall score from 0-100 based on a combination of search volume, competition, and optimization potential.
3.  Break down the score into three components: Search Volume, Competition, and Optimization Strength, rating each as 'Excellent', 'Good', 'Fair', or 'Poor'.
4.  Generate a fictional "Interest Over Time" trend line for the last 12 months. This should be an array of 12 objects, each with a 'name' (month abbreviation like 'Jan') and 'interest' (a value from 0-100).
5.  List the top 5 related search queries with a relevance score (0-100) for each.
6.  Return the entire analysis as a single JSON object, strictly adhering to the provided schema. Do not include any conversational text.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.NUMBER, description: "An overall score from 0-100." },
      scoreAnalysis: {
        type: Type.OBJECT,
        properties: {
          searchVolume: { type: Type.STRING, enum: ['Excellent', 'Good', 'Fair', 'Poor'] },
          competition: { type: Type.STRING, enum: ['Excellent', 'Good', 'Fair', 'Poor'] },
          optimizationStrength: { type: Type.STRING, enum: ['Excellent', 'Good', 'Fair', 'Poor'] },
        },
        required: ["searchVolume", "competition", "optimizationStrength"]
      },
      interestOverTime: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            interest: { type: Type.NUMBER },
          },
          required: ["name", "interest"]
        }
      },
      relatedSearches: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            score: { type: Type.NUMBER },
          },
          required: ["keyword", "score"]
        }
      }
    },
    required: ["overallScore", "scoreAnalysis", "interestOverTime", "relatedSearches"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following YouTube keyword: "${keyword}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as KeywordInsights;
  } catch (error) {
    console.error("Error getting keyword insights:", error);
    throw new Error("Failed to get keyword insights. The model may have returned an invalid response.");
  }
};

export interface NicheAnalysis {
  marketSize: {
    score: number;
    summary: string;
    addressableMarket: string;
    loyalFans: string;
  };
  saturation: {
    score: number;
    summary: string;
    reachBeyondSubscribers: string;
    avgViews: string;
  };
  monetization: {
    score: number;
    summary: string;
    viewersLoyalty: string;
    rpmEstimation: string;
  };
}

export const getNicheAnalysis = async (niche: string): Promise<NicheAnalysis> => {
  const systemInstruction = `You are a YouTube market research analyst. Your task is to analyze a given niche for its viability on the platform, focusing on Market Size, Saturation, and Monetization potential.

Action Steps:
1.  For each of the three categories (Market Size, Saturation, Monetization), provide a score from 0-100.
2.  For each category, write a 1-2 sentence summary of your findings.
3.  Provide specific, plausible metrics for each category as described in the schema.
4.  Return the entire analysis as a single JSON object, strictly adhering to the schema. Do not include any conversational text.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      marketSize: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          addressableMarket: { type: Type.STRING, description: "e.g., '10M-50M potential viewers'" },
          loyalFans: { type: Type.STRING, description: "e.g., '1M-5M dedicated fans'" },
        },
        required: ["score", "summary", "addressableMarket", "loyalFans"]
      },
      saturation: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          reachBeyondSubscribers: { type: Type.STRING, description: "e.g., 'High, viral potential'" },
          avgViews: { type: Type.STRING, description: "e.g., '50k-200k for established channels'" },
        },
        required: ["score", "summary", "reachBeyondSubscribers", "avgViews"]
      },
      monetization: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          viewersLoyalty: { type: Type.STRING, description: "e.g., 'Very High, strong community'" },
          rpmEstimation: { type: Type.STRING, description: "e.g., '$5 - $15 RPM'" },
        },
        required: ["score", "summary", "viewersLoyalty", "rpmEstimation"]
      },
    },
    required: ["marketSize", "saturation", "monetization"]
  };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the YouTube niche: "${niche}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as NicheAnalysis;
  } catch (error) {
    console.error("Error getting niche analysis:", error);
    throw new Error("Failed to get niche analysis. The model may have returned an invalid response.");
  }
};

export interface ThumbnailAnalysis {
  scoreA: number;
  analysisA: {
    clarity: string;
    emotion: string;
    branding: string;
  };
  scoreB: number;
  analysisB: {
    clarity: string;
    emotion: string;
    branding: string;
  };
  winner: 'A' | 'B';
  recommendation: string;
}

export const analyzeThumbnails = async (
  base64ImageA: string, mimeTypeA: string,
  base64ImageB: string, mimeTypeB: string,
  videoTitle: string
): Promise<ThumbnailAnalysis> => {
  const systemInstruction = `You are a YouTube thumbnail A/B testing expert. Your task is to analyze two thumbnail images in the context of a given video title and predict which one will perform better.

Action Steps:
1.  Analyze Thumbnail A and Thumbnail B based on Clarity, Emotion, and Branding. Provide a short, one-sentence analysis for each aspect.
2.  Assign a click-through rate (CTR) potential score from 0-100 for each thumbnail.
3.  Declare a "winner" (either 'A' or 'B').
4.  Provide a concise recommendation explaining why the winning thumbnail is better and how it could be improved.
5.  Return the entire analysis as a single JSON object, strictly adhering to the schema. Do not include any conversational text.`;

  const imagePartA = { inlineData: { data: base64ImageA, mimeType: mimeTypeA } };
  const imagePartB = { inlineData: { data: base64ImageB, mimeType: mimeTypeB } };
  const textPart = { text: `Analyze these two thumbnails for the video titled "${videoTitle}". Thumbnail A is the first image, Thumbnail B is the second.` };

  const schema = {
    type: Type.OBJECT,
    properties: {
      scoreA: { type: Type.NUMBER },
      analysisA: {
        type: Type.OBJECT,
        properties: {
          clarity: { type: Type.STRING },
          emotion: { type: Type.STRING },
          branding: { type: Type.STRING },
        },
        required: ["clarity", "emotion", "branding"]
      },
      scoreB: { type: Type.NUMBER },
      analysisB: {
        type: Type.OBJECT,
        properties: {
          clarity: { type: Type.STRING },
          emotion: { type: Type.STRING },
          branding: { type: Type.STRING },
        },
        required: ["clarity", "emotion", "branding"]
      },
      winner: { type: Type.STRING, enum: ['A', 'B'] },
      recommendation: { type: Type.STRING },
    },
    required: ["scoreA", "analysisA", "scoreB", "analysisB", "winner", "recommendation"]
  };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePartA, imagePartB, textPart] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ThumbnailAnalysis;
  } catch (error) {
    console.error("Error analyzing thumbnails:", error);
    throw new Error("Failed to analyze thumbnails. The model may have returned an invalid response.");
  }
};

export interface ExtractedTag {
  tag: string;
  searchVolume: number;
  competition: 'Low' | 'Medium' | 'High';
  overallScore: number;
}

export const extractVideoTags = async (videoUrl: string): Promise<ExtractedTag[]> => {
  const systemInstruction = `You are a YouTube SEO expert specializing in video tag generation. Your task is to analyze a video concept (derived from its URL/title) and generate a list of 15-20 relevant tags with associated SEO metrics.

Action Steps:
1.  Infer the video's topic from the user-provided information.
2.  Generate 15-20 relevant tags, including a mix of broad, specific, and long-tail keywords.
3.  For each tag, provide a fictional but plausible 'searchVolume' (integer), 'competition' level ('Low', 'Medium', 'High'), and an 'overallScore' (0-100).
4.  Return the list of tags as a clean JSON object, strictly adhering to the schema. Do not include any conversational text.`;
  
  const topic = `A video from the URL: ${videoUrl}. Please infer the topic and generate tags.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      tags: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            tag: { type: Type.STRING },
            searchVolume: { type: Type.NUMBER },
            competition: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            overallScore: { type: Type.NUMBER },
          },
          required: ["tag", "searchVolume", "competition", "overallScore"]
        }
      }
    },
    required: ["tags"]
  };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: topic,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    return parsed.tags as ExtractedTag[];
  } catch (error) {
    console.error("Error extracting video tags:", error);
    throw new Error("Failed to extract video tags. The model may have returned an invalid response.");
  }
};
