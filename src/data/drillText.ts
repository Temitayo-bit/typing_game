/**
 * Original themed text for the drills. Each list is filtered at run time to the
 * keys she has learned, so a sentence with ' or ? only shows up once those are taught.
 */

/** Cities, days, made-up names and apps: words that really do start with a capital. */
export const names = [
  'Seoul', 'Busan', 'Jeju', 'Tokyo', 'Kyoto', 'Osaka', 'Mumbai', 'Delhi', 'Goa', 'Jaipur',
  'Shanghai', 'Chengdu', 'Lagos', 'Abuja', 'Seattle', 'Redmond', 'Paris', 'London', 'Dubai', 'Bali',
  'Monday', 'Friday', 'Sunday', 'Saturday', 'June', 'July', 'December', 'April', 'Hyderabad', 'Nara',
  'Mina', 'Jiho', 'Hana', 'Kenji', 'Priya', 'Arjun', 'Lan', 'Wei', 'Yuna', 'Ravi',
  'Teams', 'Outlook', 'Excel', 'Windows', 'Azure',
];

/** Made-up drama, cafe and playlist titles in Title Case. */
export const titles = [
  'The Rooftop Promise', 'Midnight Ramen Club', 'Love In Seoul', 'My Secret Office Crush', 'The Lotus Pond',
  'Second Lead Syndrome', 'Rain On Our Umbrella', 'Spice Garden Kitchen', 'Moonlight Over Kyoto', 'The Plum Blossom Oath',
  'Sunday Family Dinner', 'Sushi For Two', 'Chai And Rainy Days', 'The Last Episode', 'Our Family Table',
  'Dance Until Sunrise', 'Quick Sync Forever', 'Golden Hour Brunch', 'Butter Chicken Diaries', 'Lanterns Over The River',
];

/** Sentences with capitals and full stops only, so they work in the first Shift lessons. */
export const capitalSentences = [
  'Mina ran through the rain in Seoul.',
  'On Friday we ate ramen in a tiny shop in Tokyo.',
  'Jiho finally held her hand in episode sixteen.',
  'Priya ordered biryani, naan and a mango lassi.',
  'Her Teams call started at nine and ended at ten.',
  'We met in Kyoto when the maple leaves turned red.',
  'Hana packed her bag for a weekend in Busan.',
  'The new intern in Redmond brought cookies for everyone.',
  'Kenji learned to make dosa from a video at midnight.',
  'Yuna saved the last dumpling for him, which is love.',
  'We could not pick between dosa and paneer, so we got both.',
  'Arjun planned a picnic in Jaipur and forgot the plates.',
  'Lan wrote her wish on a lantern in Shanghai.',
  'Ravi sang badly on purpose, and she laughed all night.',
  'She sent the spreadsheet and turned off her laptop.',
  'Wei waited at the bus stop with two coffees.',
  'We ate tacos.',
  'Mina smiled first.',
  'Seoul in spring is pink.',
  'Hana loves rainy Sundays.',
  'Kenji made tea for two.',
  'Her meeting ran late.',
  'Jiho brought her flowers.',
  'Tokyo never sleeps.',
  'Priya found the best samosas.',
  'The drama ended on a cliffhanger.',
];

/** Apostrophe words, a mix of contractions and possessives. */
export const contractions = [
  "don't", "it's", "you're", "I'm", "we're", "can't", "that's", "let's", "she's", "isn't",
  "won't", "didn't", "he's", "they're", "we'll", "I'll", "you'll", "wasn't", "couldn't", "there's",
  "mom's", "chef's", "grandpa's", "Mina's", "Jiho's", "today's", "tonight's",
];

/** Short questions. */
export const questions = [
  'Ready?', 'Really?', 'Sushi tonight?', 'Ramen or dosa?', 'One more episode?', 'Are you hungry?',
  'Did he say it?', 'Who is the second lead?', 'Brunch on Sunday?', 'Is this meeting an email?',
  'Can we get dumplings?', 'Why is it raining?', 'Chai or coffee?', 'Did you see the finale?',
  'Where are we going?', 'What should I wear?',
];

/** Lists and stops for comma practice. */
export const commaPhrases = [
  'rain, ramen, romance.', 'naan, rice, raita.', 'sushi, miso, gyoza.', 'shoes, bag, keys, go.',
  'laptop, coffee, calls.', 'tea, samosas, a nap.', 'rooftop, music, stars.', 'chai, cake, cuddles.',
  'one, two, three, smile.', 'kimchi, rice, eggs.', 'dinner, dessert, dancing.', 'emails, lunch, more emails.',
];

/** Somebody said something. */
export const quoteSentences = [
  "He whispered, 'Stay.'", "She said, 'One more episode.'", "Mom said, 'Dinner is ready.'",
  "The chef said, 'Trust me.'", "Grandpa said, 'What is an emoji?'", "Her boss said, 'Great point.'",
  "Jiho said, 'I waited for you.'", "We both said, 'Dumplings.'", "The waiter asked, 'Spicy?'",
  "Priya laughed and said, 'Obviously.'",
];

/** Sentences full of punctuation: commas, quotes, apostrophes and questions. */
export const punctuationSentences = [
  "Wait, did he really say 'I love you' in the rain?",
  "It's late, but one more episode can't hurt, right?",
  "She asked, 'Ramen or biryani?' and we said, 'Both.'",
  "Don't tell Mom, but we're planning a surprise party.",
  "Is it a quick sync, or is it a whole meeting again?",
  "The plum blossoms fell, and he still didn't say a word.",
  "We're going out tonight, so where are my cute shoes?",
  "Grandpa's phone beeped, and he asked, 'Who is texting me?'",
  "That's the fourth time she's rewatched the finale, isn't it?",
  "If the gyoza is gone, who ate it? It wasn't me.",
];

/**
 * Sentences with numbers. `#` becomes a number made only from the digits she knows,
 * so the same sentence works in the 1 to 5 lesson and the 6 to 0 lesson.
 */
export const numberTemplates = [
  'We ordered # plates of gyoza and ate them in # minutes.',
  'Episode # ends on a cliffhanger, so we watched # more.',
  'Table for #, please, and a bowl of ramen each.',
  'She had # meetings before lunch and # after.',
  'Samosas come # to a plate, so we ordered # plates.',
  'Only # days until our trip to Seoul.',
  'He waited # years by the lotus pond.',
  'Her playlist has # songs and she loves every one.',
  'The group chat sent # messages while we got ready.',
  'We walked # steps to find the best dumplings in town.',
];

/** Things to count. */
export const countables = [
  'dumplings', 'samosas', 'episodes', 'bowls', 'plates', 'cupcakes', 'lattes', 'roses', 'songs', 'meetings',
  'tickets', 'hugs', 'kisses', 'stars', 'cakes', 'emails', 'friends', 'lanterns', 'umbrellas', 'cookies',
];
