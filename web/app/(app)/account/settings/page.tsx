"use client";

import {
  ChangeEmailCard,
  ChangePasswordCard,
  DeleteAccountCard,
  SessionsCard,
  UpdateAvatarCard,
  UpdateFieldCard,
  UpdateNameCard,
} from "@daveyplate/better-auth-ui";
export default function page() {
  return (
    <div className="flex flex-col gap-6">
      <UpdateAvatarCard />
      <UpdateNameCard />
      <ChangeEmailCard />
      <ChangePasswordCard />
      <SessionsCard />
      <UpdateFieldCard
        name="itemPerPage"
        label="Items per page"
        type="number"
      />
      <DeleteAccountCard />
    </div>
  );
}
