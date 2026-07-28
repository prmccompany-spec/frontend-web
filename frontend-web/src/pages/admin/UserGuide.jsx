import UserGuideView from '../../components/UserGuideView/UserGuideView';
import adminGuide from '../../data/adminGuideContent';

function UserGuide() {
  return (
    <div className="admin-content">
      <UserGuideView
        title="Admin Panel User Guide"
        subtitle="What every page in the Admin Panel is for, and how to use it — organized to match the sidebar."
        sections={adminGuide}
      />
    </div>
  );
}

export default UserGuide;
