import './PricingFeatureList.scss';
import PropTypes from 'prop-types';
import CheckIcon from '@mui/icons-material/Check';

const PricingFeatureList = ({ data }) => {
  return (
    <ul className="pricing-feature-list">
      {data?.map((feature) => {
        return (
          <li className="feature" key={feature}>
            {/* <span className="wrapper-icon">
              <CheckIcon className="icon" />
            </span> */}
            ✅<p>{feature}</p>
          </li>
        );
      })}
    </ul>
  );
};

export { PricingFeatureList };

PricingFeatureList.propTypes = {
  data: PropTypes.array
};
