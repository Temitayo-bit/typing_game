import { personalTexts } from './personalTexts';

export type Pack = { id: string; name: string; blurb: string; tint: string; passages: string[] };

/** Original passages inspired by things she loves, not quoted from them. */
export const packs: Pack[] = [
  {
    id: 'kdrama',
    name: 'K-drama nights',
    blurb: 'Rooftop confessions and umbrella moments',
    tint: '#FFC2D6',
    passages: [
      'it started raining the moment she said goodbye, so of course he ran after her with one umbrella and absolutely no plan',
      'episode sixteen and they are finally holding hands, which means the second lead is crying in a convenience store somewhere',
      'she bumped into him on the stairs, the music slowed down, and the camera spun around them three whole times',
      'a cup of ramyeon at midnight, a piggyback ride home, and a secret everyone in the village somehow already knows',
    ],
  },
  {
    id: 'cdrama',
    name: 'C-drama sagas',
    blurb: 'Palace intrigue, slow-burn glances',
    tint: '#FFD9C2',
    passages: [
      'the princess waited by the lotus pond for three hundred years, which honestly felt like only forty episodes',
      'he drew his sword under the falling plum blossoms and said nothing, because his eyes had already said everything',
      'a lantern floated over the river carrying one wish, and she pretended not to notice he had written the same one',
    ],
  },
  {
    id: 'modern-family',
    name: 'Family chaos',
    blurb: 'Sitcom-style dinners that go sideways',
    tint: '#E8D5FF',
    passages: [
      'the whole family promised to keep the surprise party a secret, and the secret lasted exactly four minutes',
      'dad tried to explain the new phone to grandpa, and by the end grandpa was teaching him how to send emojis',
      'every holiday dinner starts with a toast, turns into an argument, and somehow ends with everyone hugging in the kitchen',
    ],
  },
  {
    id: 'japanese-food',
    name: 'Ramen and sushi',
    blurb: 'Late-night noodles, omakase dreams',
    tint: '#FFE9A8',
    passages: [
      'salmon nigiri, a bowl of miso soup, and a plate of gyoza that we agreed to share but you ate most of',
      'the ramen came out steaming, the egg was perfectly soft, and neither of us said a word until the bowls were empty',
      'we sat at the counter and watched the chef slice tuna like it was art, then ordered three more plates of it',
      'matcha ice cream after katsu curry is not a dessert, it is a whole personality',
    ],
  },
  {
    id: 'indian-food',
    name: 'Biryani and chai',
    blurb: 'Spice, samosas and second helpings',
    tint: '#FFCFA8',
    passages: [
      'butter chicken, garlic naan, and a mango lassi so good that we ordered a second one before the food arrived',
      'the biryani was so fragrant that the whole table went quiet, and then someone asked for more raita',
      'hot samosas, mint chutney, and a cup of masala chai on a rainy afternoon is the best kind of plan',
      'we could not decide between paneer tikka and dosa, so naturally we got both and needed a nap afterwards',
    ],
  },
  {
    id: 'going-out',
    name: 'Nights out',
    blurb: 'Outfits, rooftops, one more song',
    tint: '#C9E7FF',
    passages: [
      'new outfit, cute shoes, the playlist is perfect, and the group chat has said we are leaving in five minutes for an hour',
      'brunch turned into shopping, shopping turned into dinner, and dinner turned into dancing until our feet gave up',
    ],
  },
  {
    id: 'work',
    name: 'Office life',
    blurb: 'Teams calls, standups, reply-all regret',
    tint: '#CDEFD9',
    passages: [
      'she joined the call, unmuted herself, made a brilliant point, and closed her laptop like the main character she is',
      'three meetings, one spreadsheet, and a calendar invite titled quick sync that was not quick at all',
    ],
  },
  { id: 'from-me', name: 'From me', blurb: 'Little notes, just for you', tint: '#F06A9B', passages: personalTexts },
];
