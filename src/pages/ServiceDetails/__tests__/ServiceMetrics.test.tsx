import * as React from 'react';
import { mount, shallow, ReactWrapper } from 'enzyme';

import ServiceMetrics from '../ServiceMetrics';
import * as API from '../../../services/Api';

window['SVGPathElement'] = a => a;
let mounted: ReactWrapper<any, any> | null;

const mockAPIToPromise = (func: keyof typeof API, obj: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    jest.spyOn(API, func).mockImplementation(() => {
      return new Promise(r => {
        r({ data: obj });
        setTimeout(() => {
          try {
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 1);
      });
    });
  });
};

const mockMetrics = (metrics: any): Promise<void> => {
  return mockAPIToPromise('getServiceMetrics', metrics);
};

const mockGrafanaInfo = (info: any): Promise<any> => {
  return mockAPIToPromise('getGrafanaInfo', info);
};

const createMetric = (name: string) => {
  return {
    matrix: [
      {
        metric: { __name__: name },
        values: [[1111, 5], [2222, 10]]
      }
    ]
  };
};

const createHistogram = (name: string) => {
  return {
    average: {
      matrix: [
        {
          metric: { __name__: name },
          values: [[1111, 10], [2222, 11]]
        }
      ]
    },
    median: {
      matrix: [
        {
          metric: { __name__: name },
          values: [[1111, 20], [2222, 21]]
        }
      ]
    },
    percentile95: {
      matrix: [
        {
          metric: { __name__: name },
          values: [[1111, 30], [2222, 31]]
        }
      ]
    },
    percentile99: {
      matrix: [
        {
          metric: { __name__: name },
          values: [[1111, 40], [2222, 41]]
        }
      ]
    }
  };
};

describe('ServiceMetrics', () => {
  beforeEach(() => {
    mounted = null;
  });
  afterEach(() => {
    if (mounted) {
      mounted.unmount();
    }
  });

  it('renders initial layout', () => {
    mockGrafanaInfo({});
    const wrapper = shallow(<ServiceMetrics namespace="ns" service="svc" />);
    expect(wrapper).toMatchSnapshot();
  });

  it('mounts and loads empty metrics', done => {
    const allMocksDone = [
      mockMetrics({ metrics: {}, histograms: {} })
        .then(() => {
          mounted!.update();
          expect(mounted!.find('.card-pf-body')).toHaveLength(1);
          mounted!.find('.card-pf-body').forEach(pfCard => expect(pfCard.children().length === 0));
        })
        .catch(err => done.fail(err)),
      mockGrafanaInfo({
        url: 'http://172.30.139.113:3000',
        serviceDashboardPath: '/dashboard/db/istio-dashboard',
        varService: 'var-service'
      })
        .then(() => {
          mounted!.update();
          expect(mounted!.find('#grafana-link > a').map(div => div.getElement().props)).toEqual([
            {
              children: 'View in Grafana',
              href: 'http://172.30.139.113:3000/dashboard/db/istio-dashboard?var-service=svc.ns.svc.cluster.local',
              target: '_blank'
            }
          ]);
        })
        .catch(err => done.fail(err))
    ];
    Promise.all(allMocksDone).then(() => done());
    mounted = mount(<ServiceMetrics namespace="ns" service="svc" />);
  });

  it(
    'mounts and loads full metrics',
    done => {
      const allMocksDone = [
        mockMetrics({
          metrics: {
            request_count_in: createMetric('m1')
          },
          histograms: {
            request_size_in: createHistogram('m3'),
            request_duration_in: createHistogram('m5'),
            response_size_in: createHistogram('m7')
          }
        })
          .then(() => {
            mounted!.update();
            expect(mounted!.find('LineChart')).toHaveLength(4);
          })
          .catch(err => done.fail(err)),
        mockGrafanaInfo({})
      ];
      Promise.all(allMocksDone).then(() => done());
      mounted = mount(<ServiceMetrics namespace="ns" service="svc" />);
    },
    10000
  ); // Increase timeout for this test
});
