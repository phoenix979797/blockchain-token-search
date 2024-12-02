const moment = require("moment");

// Configuration de moment.js en français
moment.locale("fr");

exports.formatNumber = (num) => {
  const value = Number(num);

  if (value === null || isNaN(value) || value === undefined) return "0";

  // Pour les très petites valeurs
  if (Math.abs(value) < 0.01) {
    const str = value.toString();
    if (str.includes("e-")) {
      const [base, exponent] = str.split("e-");
      const zeroCount = parseInt(exponent) - 1;
      const baseNumber = parseFloat(base).toFixed(4);
      return `$0.0${zeroCount}${baseNumber}`;
    }
  }

  // Pour les autres valeurs
  if (value < 1000) {
    return "$" + value.toFixed(4);
  }

  return (
    "$" +
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value)
  );
};

exports.formatLiquidityFriendly = (num) => {
  // Conversion explicite en nombre
  const value = Number(num);

  if (value === null || isNaN(value) || value === undefined) return "0$";

  // Pour les valeurs très proches de zéro (inférieures à 0.01$)
  if (Math.abs(value) < 0.01) {
    return "~0$";
  }

  // Pour les valeurs entre 0.01$ et 999.99$
  if (value < 1000) {
    return value.toFixed(2) + "$";
  }

  // Pour les valeurs entre 1K$ et 999.9K$
  if (value < 1000000) {
    return (value / 1000).toFixed(1) + "K$";
  }

  // Pour les valeurs de 1M$ et plus
  return (value / 1000000).toFixed(1) + "M$";
};

exports.formatTimeAgo = (date) => {
  const now = moment();
  const creationTime = moment(date);
  const duration = moment.duration(now.diff(creationTime));

  if (duration.asMinutes() < 60) {
    return `créé il y a ${Math.round(duration.asMinutes())} minutes`;
  } else if (duration.asHours() < 24) {
    return `créé il y a ${Math.round(duration.asHours())} heures`;
  } else {
    return `créé il y a ${Math.round(duration.asDays())} jours`;
  }
};

exports.getLiquidityClassName = (liquidity) => {
  const value = Number(liquidity);
  if (value >= 5) return "liquidity-high";
  if (value >= 1) return "liquidity-medium";
  return "liquidity-low";
};
