import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function MemberDetails() {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [loans, setLoans] = useState([]);
  const navigate = useNavigate();

  // Fetch member info
  useEffect(() => {
    const fetchMember = async () => {
      const res = await axios.get(`http://localhost:5000/api/member/${memberId}`);
      setMember(res.data);
    };
    fetchMember();
  }, [memberId]);

  // Fetch member's loan/collection info
  useEffect(() => {
    const fetchLoans = async () => {
      const res = await axios.get(`http://localhost:5000/api/collections/${memberId}`);
      setLoans(res.data);
    };
    fetchLoans();
  }, [memberId]);

  if (!member) return <div className="p-6">Loading member details...</div>;

  return (
    <div className="p-6">
      <button className="mb-4 text-blue-500" onClick={() => navigate(-1)}>
        &larr; Back
      </button>

      <h2 className="text-2xl font-bold mb-4">{member.name}'s Loan Details</h2>
      <p>Email: {member.email}</p>
      <p>Phone: {member.phone}</p>

      <h3 className="text-xl font-semibold mt-4 mb-2">Loans & Collections</h3>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Amount</th>
            <th className="border px-4 py-2">Released Date</th>
            <th className="border px-4 py-2">Loan Start Date</th>
            <th className="border px-4 py-2">Repayment Day</th>
            <th className="border px-4 py-2">Last Collected</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((l) => (
            <tr key={l.id}>
              <td className="border px-4 py-2">{l.amount}</td>
              <td className="border px-4 py-2">{l.released_date}</td>
              <td className="border px-4 py-2">{l.loan_start_date}</td>
              <td className="border px-4 py-2">{l.repayment_day}</td>
              <td className="border px-4 py-2">{l.last_collected}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
