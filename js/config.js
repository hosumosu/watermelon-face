window.App = window.App || {};

App.CONFIG = (function () {
  var TIER_COUNT = 10;

  var TIER_RADII = [16, 24, 32, 40, 52, 64, 78, 94, 114, 140];

  // Tiers 1~9 (index 0~8) fall back to these fruit emojis until the user adds
  // real artwork as image/tier1.png ... image/tier9.png. Tier 10 is always the
  // watermelon image.
  var TIER_FRUIT_EMOJI = ['🍒', '🍓', '🍇', '🍊', '🍎', '🍐', '🍑', '🍍', '🍈'];
  var WATERMELON_IMAGE = 'image/watermelon.png';
  var TIER_IMAGE_PATHS = [];
  for (var ti = 1; ti <= 9; ti++) {
    TIER_IMAGE_PATHS.push('image/tier' + ti + '.png');
  }

  var TOPIC_PRESETS = [
    '방구냄새 가장 지독할 것 같은 순위',
    '지각 가장 많이 할 것 같은 순위',
    '몰래 야식 가장 많이 먹을 것 같은 순위',
    '복권 당첨되면 제일 먼저 연락 끊을 것 같은 순위',
    '결혼식 축의금 가장 적게 낼 것 같은 순위',
    '좀비 아포칼립스에서 가장 먼저 잡아먹힐 것 같은 순위',
    '단체 사진 찍을 때 항상 눈 감을 것 같은 순위',
    '몰래 첫사랑 인스타 훔쳐볼 것 같은 순위',
    '술 마시면 필름 가장 잘 끊길 것 같은 순위',
    '여행 가서 길 가장 잘 잃을 것 같은 순위',
    '헤어지고 SNS 저격글 올릴 것 같은 순위',
    '카톡 답장 가장 늦게 할 것 같은 순위',
    '회식 자리에서 제일 먼저 취할 것 같은 순위',
    '다이어트 작심삼일 가장 빨리 포기할 것 같은 순위',
    '몰래 방귀 뀌고 시치미 뗄 것 같은 순위'
  ];

  var DROPPABLE_TIERS = [0, 1, 2, 3, 4];

  // Drop probability weights, matching DROPPABLE_TIERS by index. Smaller
  // fruits appear more often, like the original suika game (30/30/20/12/8%).
  var DROP_WEIGHTS = [30, 30, 20, 12, 8];

  var PHYSICS = {
    restitution: 0.1,
    friction: 0.5,
    frictionStatic: 0.8,
    frictionAir: 0.002,
    density: 0.001,
    positionIterations: 8,
    velocityIterations: 6
  };

  var BOARD_WIDTH = 420;
  var BOARD_HEIGHT = 600;
  var SPAWN_Y = 44;
  var DANGER_Y = 110;
  var DANGER_TIME_MS = 2000;
  var SPAWN_GRACE_MS = 1000;
  var DROP_COOLDOWN_MS = 600;

  // Sprites are drawn slightly larger than the physics circle so fruits look
  // packed together instead of leaving visible gaps.
  var BALL_VISUAL_SCALE = 1.12;

  function scoreForTier(tierIndex) {
    return ((tierIndex + 1) * (tierIndex + 2) / 2) * 10;
  }

  return {
    TIER_COUNT: TIER_COUNT,
    TIER_RADII: TIER_RADII,
    TIER_FRUIT_EMOJI: TIER_FRUIT_EMOJI,
    WATERMELON_IMAGE: WATERMELON_IMAGE,
    TIER_IMAGE_PATHS: TIER_IMAGE_PATHS,
    TOPIC_PRESETS: TOPIC_PRESETS,
    DROPPABLE_TIERS: DROPPABLE_TIERS,
    DROP_WEIGHTS: DROP_WEIGHTS,
    PHYSICS: PHYSICS,
    BOARD_WIDTH: BOARD_WIDTH,
    BOARD_HEIGHT: BOARD_HEIGHT,
    SPAWN_Y: SPAWN_Y,
    DANGER_Y: DANGER_Y,
    DANGER_TIME_MS: DANGER_TIME_MS,
    SPAWN_GRACE_MS: SPAWN_GRACE_MS,
    DROP_COOLDOWN_MS: DROP_COOLDOWN_MS,
    BALL_VISUAL_SCALE: BALL_VISUAL_SCALE,
    scoreForTier: scoreForTier
  };
})();
