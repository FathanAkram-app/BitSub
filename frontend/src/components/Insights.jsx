import { Card, CardContent } from './ui/Card'

export default function Insights({ authClient }) {
  return (
    <div className="insights">
      <div className="insights-grid">
        <Card>
          <CardContent>
            <h4>Retention Rate</h4>
            <div className="metric-value">94%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h4>Avg Revenue Per User</h4>
            <div className="metric-value">$2.45</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h4>Active Subscriptions</h4>
            <div className="metric-value">15</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h4>Avg Subscription Length</h4>
            <div className="metric-value">3.2 months</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}