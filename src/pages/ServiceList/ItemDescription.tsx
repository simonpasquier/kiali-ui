import * as React from 'react';
import { ServiceItem } from '../../types/ServiceListComponent';
import { ServiceHealth } from '../../types/Health';
import { DisplayMode, HealthIndicator } from '../../components/Health/HealthIndicator';
import ServiceErrorRate from './ServiceErrorRate';

interface Props {
  item: ServiceItem;
}
interface State {
  health?: ServiceHealth;
}

export default class ItemDescription extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { health: undefined };
  }

  componentDidMount() {
    this.onItemChanged(this.props.item);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.item.healthPromise !== prevProps.item.healthPromise) {
      this.onItemChanged(this.props.item);
    }
  }

  onItemChanged(item: ServiceItem) {
    item.healthPromise.then(h => this.setState({ health: h })).catch(err => this.setState({ health: undefined }));
  }

  render() {
    return this.state.health ? (
      <table style={{ width: '30em', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td>
              <strong>Health: </strong>
              <HealthIndicator id={this.props.item.name} health={this.state.health} mode={DisplayMode.SMALL} />
            </td>
            <td>
              <ServiceErrorRate requestHealth={this.state.health.requests} />
            </td>
          </tr>
        </tbody>
      </table>
    ) : (
      <span />
    );
  }
}
