const config = require('./config');

const requests = {};
const authResults = {};
const pizzaResults = {};
const profits = {};
const activeUsers = {};
const latency = { total: 0, count: 0 };
const pizzaLatency = { total: 0, count: 0 };

function track(endpoint) {
  return (req, res, next) => {
    requests[endpoint] = (requests[endpoint] || 0) + 1;
    next();
  };
}

function trackLatency() {
  return ((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      latency.total += duration;
      latency.count += 1;
      //console.log(`Request to ${req.path} took ${duration}ms`);
    });
    next();
  });
}

function trackPizzaLatency() {
  return ((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      pizzaLatency.total += duration;
      pizzaLatency.count += 1;
      //console.log(`Request to ${req.path} took ${duration}ms`);
    });
    next();
  });
}

function trackAuth(result) {
  authResults[result] = (authResults[result] || 0) + 1;
}

function trackPizza(result) {
  pizzaResults[result] = (pizzaResults[result] || 0) + 1;
}

function trackProfits(items) {
  let total = 0;
  for (const item of items) {
    total += item.price;
  }
  profits.total = (profits.total || 0) + total;
}

function addActiveUser() {
  activeUsers['total'] = (activeUsers['total'] || 0) + 1;
}

function removeActiveUser() {
  activeUsers['total'] = (activeUsers['total'] || 0) - 1;
}

const os = require('os');

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  console.log(cpuUsage);
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

// This will periodically send metrics to Grafana
// eslint-disable-next-line no-unused-vars
const timer = setInterval(() => {
  try {
    // Object.keys(requests).forEach((endpoint) => {
    //   sendMetricToGrafana('requests', requests[endpoint], { endpoint });
    // });
    // sendMetricToGrafana('cpu_usage', getCpuUsagePercentage(), {});
    // sendMetricToGrafana('memory_usage', getMemoryUsagePercentage(), {});
    const metrics = [];
    httpMetrics(metrics);
    systemMetrics(metrics);
    authMetrics(metrics);
    pizzaMetrics(metrics);
    profitMetrics(metrics);
    userMetrics(metrics);
    latencyMetrics(metrics);
    pizzaLatencyMetrics(metrics);

    sendMetric2Grafana(metrics);
  } catch (error) {
    console.log(error);
  }
}, 10000);

function httpMetrics(metrics) {
  Object.keys(requests).forEach((endpoint) => {
    metrics.push({
      name: 'requests',
      unit: '1',
      sum: {
        dataPoints: [
          {
            asInt: requests[endpoint],
            timeUnixNano: Date.now() * 1000000,
            attributes: [{key: 'endpoint', value: {stringValue: endpoint}}, {key: 'source', value: {stringValue: config.metrics.source}}],
          },
        ],
        aggregationTemporality: 'AGGREGATION_TEMPORALITY_CUMULATIVE',
        isMonotonic: true,
      },
    },)
    //sendMetricToGrafana('requests', requests[endpoint], { endpoint });
  });
}

function systemMetrics (metrics) {
  metrics.push({
    name: "cpu_usage",
    unit: "percent",
    gauge: {
      dataPoints: [
        {
          asDouble: getCpuUsagePercentage(),
          timeUnixNano: Date.now() * 1000000,
          attributes: [{ key: "core", value: { stringValue: "all" } }, { key: "source", value: { stringValue: config.metrics.source}}],
        },
      ],
    },
  });

  metrics.push({
    name: "memory_usage",
    unit: "percent",
    gauge: {
      dataPoints: [
        {
          asDouble: getMemoryUsagePercentage(),
          timeUnixNano: Date.now() * 1000000,
          attributes: [{ key: "type", value: { stringValue: "RAM" } }, { key: "source", value: { stringValue: config.metrics.source}}],
        },
      ],
    },
  });
}

function authMetrics(metrics) {
  Object.keys(authResults).forEach((result) => {
    metrics.push({
      name: 'auth',
      unit: '1',
      sum: {
        dataPoints: [
          {
            asInt: authResults[result],
            timeUnixNano: Date.now() * 1000000,
            attributes: [{key: 'result', value: {stringValue: result}}, {key: 'source', value: {stringValue: config.metrics.source}}],
          },
        ],
        aggregationTemporality: 'AGGREGATION_TEMPORALITY_CUMULATIVE',
        isMonotonic: true,
      },
    },)
    //sendMetricToGrafana('requests', requests[endpoint], { endpoint });
  });
}

function pizzaMetrics(metrics) {
  //console.log(pizzaResults);
  Object.keys(pizzaResults).forEach((result) => {
    metrics.push({
      name: 'pizza',
      unit: '1',
      sum: {
        dataPoints: [
          {
            asInt: pizzaResults[result],
            timeUnixNano: Date.now() * 1000000,
            attributes: [{key: 'result', value: {stringValue: result}}, {key: 'source', value: {stringValue: config.metrics.source}}],
          },
        ],
        aggregationTemporality: 'AGGREGATION_TEMPORALITY_CUMULATIVE',
        isMonotonic: true,
      },
    },)
    //sendMetricToGrafana('requests', requests[endpoint], { endpoint });
  });
}

function profitMetrics(metrics) {
  //console.log(profits);
  metrics.push({
    name: 'profit',
    unit: 'BTC',
    sum: {
      dataPoints: [
        {
          asDouble: profits.total,
          timeUnixNano: Date.now() * 1000000,
          attributes: [
            { key: "source", value: { "stringValue" : config.metrics.source}}
          ],
        },
      ],
      aggregationTemporality: 'AGGREGATION_TEMPORALITY_CUMULATIVE',
      isMonotonic: true,
    },
  });
}

function userMetrics(metrics) {
  //console.log(activeUsers);
  metrics.push({
    name: 'active_users',
    unit: '1',
    sum: {
      dataPoints: [
        {
          asInt: activeUsers['total'],
          timeUnixNano: Date.now() * 1000000,
          attributes: [
            { key: "source", value: { "stringValue" : config.metrics.source}}
          ],
        },
      ],
      aggregationTemporality: 'AGGREGATION_TEMPORALITY_CUMULATIVE',
      isMonotonic: true,
    },
  });
}

function latencyMetrics(metrics) {
  //console.log(latency);
  if (latency.count === 0) return;

  const avgLatency = Math.round(latency.total / latency.count);
  metrics.push({
    name: 'latency',
    unit: 'ms',
    gauge: {
      dataPoints: [
        {
          asInt: avgLatency,
          timeUnixNano: Date.now() * 1000000,
          attributes: [
            { key: "source", value: { "stringValue" : config.metrics.source}}
          ],
        },
      ],
    },
  });

  latency.total = 0;
  latency.count = 0;
}

function pizzaLatencyMetrics(metrics) {
  //console.log(pizzaLatency);
  if (pizzaLatency.count === 0) return;

  const avgLatency = Math.round(pizzaLatency.total / pizzaLatency.count);
  metrics.push({
    name: 'Pizza Latency',
    unit: 'ms',
    gauge: {
      dataPoints: [
        {
          asInt: avgLatency,
          timeUnixNano: Date.now() * 1000000,
          attributes: [
            { key: "source", value: { "stringValue" : config.metrics.source}}
          ],
        },
      ],
    },
  });

  pizzaLatency.total = 0;
  pizzaLatency.count = 0;
}

//TODO in order for the sendMetric to work, we will need to set the correct metric value for different types. 

function sendMetric2Grafana(metrics) {
   const metric = {
    resourceMetrics: [
      {
        resource: {
          attributes: [
            { key: "source", value: { "stringValue" : config.metrics.source}}
          ]
        },
        scopeMetrics: [
          {
            metrics: metrics
          },
        ],
      },
    ],
  };

  fetch(`${config.metrics.url}`, {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: { Authorization: `Bearer ${config.metrics.apiKey}`, 'Content-Type': 'application/json' },
  })
    .then((response) => {
      if (!response.ok) {
        console.error('Failed to push metrics data to Grafana');
        console.log(response);
      } else {
        console.log(`Pushed metrics`);
      }
    })
    .catch((error) => {
      console.error('Error pushing metrics:', error);
    });
}

module.exports = { track, trackAuth, trackPizza, trackProfits, addActiveUser, removeActiveUser, trackLatency, trackPizzaLatency };