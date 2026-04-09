/**
 * KPI Card component for dashboard statistics
 */
const KPICard = ({
  title,
  value,
  icon: Icon,
  iconBgColor = 'bg-blue-100 dark:bg-blue-900',
  iconColor = 'text-blue-600 dark:text-blue-400',
  valueColor = '',
  variation = null,
  subtitle = null,
  onClick = null
}) => {
  const formatVariation = (variation) => {
    if (variation === null || variation === undefined) return null;
    const isPositive = variation > 0;
    const arrow = isPositive ? '\u2191' : '\u2193';
    const color = isPositive ? 'text-green-500' : 'text-red-500';
    return (
      <p className={`${color} text-sm flex items-center mt-2`}>
        <span>{arrow} {Math.abs(variation).toFixed(1)}%</span>
        <span className="text-gray-500 dark:text-gray-400 ml-1">desde el mes pasado</span>
      </p>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-700 dark:text-gray-300">{title}</h3>
        <div className={`p-2 ${iconBgColor} rounded-lg`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${valueColor || 'text-gray-900 dark:text-white'}`}>{value}</p>
      {subtitle && (
        <p className="text-lg text-gray-700 dark:text-gray-300 mt-1">{subtitle}</p>
      )}
      {formatVariation(variation)}
    </div>
  );
};

export default KPICard;
