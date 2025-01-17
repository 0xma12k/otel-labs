const { NodeSDK } = require('@opentelemetry/sdk-node');
const { Resource } = require('@opentelemetry/resources');
const {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} = require('@opentelemetry/semantic-conventions');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');


// Define resource attributes for the service
const resource = Resource.default().merge(
    new Resource({
        [ATTR_SERVICE_NAME]: 'training-01-notify-service',
        [ATTR_SERVICE_VERSION]: '1.0.0',
    }),
);

const prometheusExporter = new PrometheusExporter(
    {
        port: 9465,
    },
    () => {
        console.log('Prometheus scrape endpoint: http://localhost:9465/metrics');
    }
);

const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');




const sdk = new NodeSDK({
    resource: resource,
    traceExporter: new OTLPTraceExporter({
      url: 'http://localhost:4318/v1/traces',
    }),
    metricReader: prometheusExporter,
    instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
