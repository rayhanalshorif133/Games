# 🎮 Game Development & Asset Prompts

এই ফাইলে আপনার টেক্সট ফাইলগুলোর (`set command for scroe api.txt` এবং `banner make.txt`) ওপর ভিত্তি করে সহজে এক ক্লিকে কপি করার মতো সুন্দর প্রম্পট সাজিয়ে দেওয়া হলো। প্রতিটি কোড ব্লকের উপরের **Copy** আইকনে ক্লিক করে সরাসরি যেকোনো AI (ChatGPT, Claude, Cursor, Copilot, Midjourney ইত্যাদি)-তে ব্যবহার করতে পারবেন।

---

## 1. 📊 Score API Integration Prompts
> **Source File:** `set command for scroe api.txt`  
> **কাজের ধরন:** গেমে `send_score_api.js` পরিবর্তন না করে গেম ওভার হলে `sendScore` ফাংশন কল করানোর জন্য।

### অপশন ১: স্ট্যান্ডার্ড ইংলিশ প্রম্পট (AI Coding Assistant-এর জন্য সবচেয়ে ভালো)
```text
Please integrate the score submission into this game without modifying the send_score_api.js file. The send_score_api.js function must remain completely untouched. Simply ensure it is loaded and call the `sendScore(finalScore)` function with the player's final score exactly when the game is over.
```

### অপশন ২: বিস্তারিত ও সুনির্দিষ্ট স্টেপ প্রম্পট (Detailed / Strict)
```text
Integrate the existing `send_score_api.js` script into this game adhering to these strict rules:
1. Do NOT make any changes to `send_score_api.js` or its inner functions.
2. Locate the game over logic / trigger in the game code.
3. Call `window.sendScore(finalScore)` (or `sendScore(score)`) precisely when the player loses or the game ends.
4. Pass the player's final numeric score as the argument.
5. Ensure the score is sent only once per game over event.
```

### অপশন ৩: বাংলা / বাংলিশ প্রম্পট
```text
send_score_api.js ফাইলের কোনো কোড বা ফাংশন পরিবর্তন করবে না। শুধু গেমের কোডে গেম ওভার (Game Over) হওয়ার মুহূর্তে `sendScore(finalScore)` ফাংশনটি কল করিয়ে দাও, যেন প্লেয়ারের ফাইনাল স্কোর API-তে সাবমিট হয়।
```

---

## 2. 🎨 Game Banner Creation Prompts
> **Source File:** `banner make.txt`  
> **কাজের ধরন:** গেমের UI অনুযায়ী ১০০০x৬০০ সাইজের শুধু গেমের টাইটেল সহ ব্যানার তৈরির জন্য।

### অপশন ১: AI ইমেজ জেনারেটর প্রম্পট (Midjourney, DALL-E, Ideogram, Flux এর জন্য)
```text
A high-quality game banner inspired by the game's UI theme and visual style. Dimensions: 1000px width by 600px height (aspect ratio 5:3). The banner must feature ONLY the game title "[INSERT GAME TITLE HERE]" centered in bold, stylized typography matching the game's aesthetic. Clean background with vibrant ambient lighting and subtle neon accents. No additional text, no character clutter—just the game title as the centerpiece. Cinematic, polished, 4k.
```

### অপশন ২: কোডিং AI দিয়ে HTML/CSS/Canvas ব্যানার তৈরির প্রম্পট
```text
Create a modern, eye-catching game banner using HTML and CSS (or Canvas) based on this game's UI.
Requirements:
- Exact dimensions: Width: 1000px, Height: 600px.
- The banner must contain ONLY the game title: "[INSERT GAME TITLE HERE]". No extra text or subheadings.
- Typography and color palette should match the game's existing UI theme (neon glows, sleek borders, arcade dark mode).
- Clean, centered composition with modern design elements.
```

### অপশন ৩: বাংলা / বাংলিশ প্রম্পট
```text
এই গেমের UI এবং কালার থিমের ওপর ভিত্তি করে আমাকে একটা সুন্দর ব্যানার তৈরি করে দাও।
- ব্যানারের সাইজ: প্রস্থ ১০০০px এবং উচ্চতা ৬০০px (Width: 1000px, Height: 600px)
- ব্যানারে শুধুমাত্র গেমের টাইটেল থাকবে, কোনো অতিরিক্ত লেখা বা সাবটাইটেল থাকবে না
- ডিজাইনটি যেন আকর্ষণীয়, আধুনিক এবং গেমের স্টাইলের সাথে পুরোপুরি মানানসই হয়
```

---

### 💡 কুইক টিপস:
- ইমেজ প্রম্পট ব্যবহার করার সময় `[INSERT GAME TITLE HERE]` এর জায়গায় আপনার গেমের নাম বসিয়ে দিবেন।
- কোডিং প্রম্পটের ক্ষেত্রে আপনি যে গেমে API লাগাতে চান, সেই গেমের কোড বা ফাইলের সাথে প্রম্পটটি পেস্ট করবেন।

