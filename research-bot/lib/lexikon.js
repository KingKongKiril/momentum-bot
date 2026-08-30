/* Woerterliste fuer die Schlagzeilen-Bewertung.
   Bewusst simpel: ein Zaehl-Lexikon, keine echte Sprachmodell-Analyse.
   Das ist eine grobe Heuristik, kein Sentiment-NLP-Modell - siehe
   sentiment.js und die Warnhinweise im Bot fuer den entscheidenden
   Vorbehalt: Ironie, Verneinung und Kontext werden nicht verstanden. */
'use strict';

const POSITIV = [
  'surge', 'surges', 'soar', 'soars', 'rally', 'rallies', 'gain', 'gains',
  'jump', 'jumps', 'climb', 'climbs', 'rise', 'rises', 'record', 'high',
  'highs', 'beat', 'beats', 'upgrade', 'upgraded', 'outperform', 'bullish',
  'growth', 'strong', 'stronger', 'boom', 'recovery', 'rebound', 'optimism',
  'profit', 'profits', 'boost', 'boosts', 'win', 'wins', 'upbeat'
];

const NEGATIV = [
  'plunge', 'plunges', 'crash', 'crashes', 'slump', 'slumps', 'fall',
  'falls', 'drop', 'drops', 'decline', 'declines', 'sink', 'sinks', 'tumble',
  'tumbles', 'downgrade', 'downgraded', 'underperform', 'bearish', 'recession',
  'slowdown', 'weak', 'weaker', 'loss', 'losses', 'layoff', 'layoffs',
  'default', 'bankruptcy', 'sell-off', 'selloff', 'fear', 'fears', 'panic',
  'inflation', 'warns', 'warning', 'cut', 'cuts', 'miss', 'misses', 'risk',
  'risks', 'volatility', 'turmoil', 'crisis'
];

module.exports = { POSITIV, NEGATIV };
